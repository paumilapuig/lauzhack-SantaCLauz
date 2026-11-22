import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { createTeacherApi } from "./teacherApi";

const BASE = "http://api.test";
const FIELDS = { title: "Cellule", subject: "Biologie", lesson_date: "2026-11-21" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function setup(response: Response | Error = jsonResponse([])) {
  const fetchImpl = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  const api = createTeacherApi(BASE, async () => "tok", fetchImpl as unknown as typeof fetch);
  const lastCall = () => {
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    return { url, init, headers: init.headers as Headers };
  };
  return { api, lastCall };
}

describe("teacherApi", () => {
  it("lists lessons with the bearer token", async () => {
    const { api, lastCall } = setup();
    await api.listLessons();
    expect(lastCall().url).toBe(`${BASE}/api/lessons`);
    expect(lastCall().headers.get("Authorization")).toBe("Bearer tok");
  });

  it("posts text lessons as JSON", async () => {
    const { api, lastCall } = setup(jsonResponse({ lesson_id: "x", terms: [] }));
    await api.createLessonFromText(FIELDS, "Le texte");
    const { init, headers } = lastCall();
    expect(init.method).toBe("POST");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ ...FIELDS, source_text: "Le texte" }));
  });

  it("posts file lessons as FormData without a Content-Type", async () => {
    const { api, lastCall } = setup(jsonResponse({ lesson_id: "x", terms: [] }));
    const file = new File(["abc"], "a.txt", { type: "text/plain" });
    await api.createLessonFromFile(FIELDS, file);
    const { init, headers } = lastCall();
    const body = init.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("title")).toBe("Cellule");
    expect(body.get("subject")).toBe("Biologie");
    expect(body.get("lesson_date")).toBe("2026-11-21");
    expect((body.get("file") as File).name).toBe("a.txt");
    expect(headers.has("Content-Type")).toBe(false);
  });

  it("gets the dashboard of a lesson", async () => {
    const { api, lastCall } = setup(jsonResponse({}));
    await api.getDashboard("abc");
    expect(lastCall().url).toBe(`${BASE}/api/teacher/lessons/abc/dashboard`);
  });

  it("rejects with the HTTP status on a non-ok answer", async () => {
    const { api } = setup(jsonResponse({}, 502));
    await expect(api.listLessons()).rejects.toMatchObject({ status: 502 });
    await expect(api.listLessons()).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects with status 0 when the network fails", async () => {
    const { api } = setup(new Error("boom"));
    await expect(api.listLessons()).rejects.toMatchObject({ status: 0 });
  });
});
