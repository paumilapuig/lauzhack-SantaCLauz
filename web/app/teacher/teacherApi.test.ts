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

  it("sends the course of a new lesson, as JSON and as a form field", async () => {
    const text = setup(jsonResponse({ lesson_id: "x", terms: [] }));
    await text.api.createLessonFromText({ ...FIELDS, course_id: "c1" }, "Le texte");
    expect(JSON.parse(text.lastCall().init.body as string).course_id).toBe("c1");
    const upload = setup(jsonResponse({ lesson_id: "x", terms: [] }));
    await upload.api.createLessonFromFile({ ...FIELDS, course_id: "c1" }, new File(["abc"], "a.txt"));
    expect((upload.lastCall().init.body as FormData).get("course_id")).toBe("c1");
  });

  it("leaves the course out when the lesson has none", async () => {
    const upload = setup(jsonResponse({ lesson_id: "x", terms: [] }));
    await upload.api.createLessonFromFile(FIELDS, new File(["abc"], "a.txt"));
    expect((upload.lastCall().init.body as FormData).has("course_id")).toBe(false);
  });

  it("lists and creates courses", async () => {
    const list = setup();
    await list.api.listCourses();
    expect(list.lastCall().url).toBe(`${BASE}/api/teacher/courses`);
    const create = setup(jsonResponse({ id: "c1", name: "Biologie 1re", lesson_count: 0 }));
    await create.api.createCourse("Biologie 1re");
    expect(create.lastCall().init.method).toBe("POST");
    expect(create.lastCall().init.body).toBe(JSON.stringify({ name: "Biologie 1re" }));
  });

  it("moves a lesson into a course with PATCH", async () => {
    const { api, lastCall } = setup(jsonResponse({ id: "l1", course_id: "c1" }));
    await api.moveLesson("l1", "c1");
    expect(lastCall().url).toBe(`${BASE}/api/teacher/lessons/l1`);
    expect(lastCall().init.method).toBe("PATCH");
    expect(lastCall().init.body).toBe(JSON.stringify({ course_id: "c1" }));
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
