import { describe, expect, it, vi } from "vitest";
import { classApiMode, createHttpClassApi, createMockClassApi } from "./classApi";

const blob = new Blob(["x"], { type: "audio/webm" });
const clip = { sessionId: "s1", blob, tStart: 3, tEnd: 13, transcript: "bonjour" };

function fakeFetch(status = 200, body: unknown = { ok: true }) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

describe("createHttpClassApi", () => {
  it("uploads the clip as FormData with a Bearer token and no Content-Type", async () => {
    const fetchImpl = fakeFetch(200, { clip_id: "c1", audio_path: "p" });
    const api = createHttpClassApi("http://api", async () => "tok", fetchImpl);
    await api.uploadClip(clip);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://api/api/clips");
    expect(init.method).toBe("POST");
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer tok");
    expect(headers.has("Content-Type")).toBe(false);
    const form = init.body as FormData;
    expect(form.get("session_id")).toBe("s1");
    expect(form.get("t_start")).toBe("3");
    expect(form.get("t_end")).toBe("13");
    expect(form.get("transcript")).toBe("bonjour");
    expect(form.get("audio")).toBeInstanceOf(Blob);
  });

  it("posts a lost event with its transcript context", async () => {
    const fetchImpl = fakeFetch();
    const api = createHttpClassApi("http://api", async () => "tok", fetchImpl);
    await api.postLost({ sessionId: "s1", tSec: 100, tStart: 40, transcript: "salut" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://api/api/sessions/s1/events");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({
      t_sec: 100,
      type: "lost",
      lemma: null,
      context: { t_start: 40, transcript: "salut" },
    });
  });

  it("starts a session and returns its id", async () => {
    const api = createHttpClassApi("http://api", async () => null, fakeFetch(200, { session_id: "s9" }));
    expect(await api.startSession("lesson")).toBe("s9");
  });

  it("picks the newest lesson from GET /api/lessons", async () => {
    const fetchImpl = fakeFetch(200, [{ id: "new" }, { id: "old" }]);
    const api = createHttpClassApi("http://api", async () => "tok", fetchImpl);
    expect(await api.latestLessonId()).toBe("new");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://api/api/lessons");
    expect(init.method).toBe("GET");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok");
  });

  it("fails when there is no lesson yet", async () => {
    const api = createHttpClassApi("http://api", async () => "tok", fakeFetch(200, []));
    await expect(api.latestLessonId()).rejects.toThrow();
  });

  it("loads the class pack of a lesson", async () => {
    const pack = { lesson: { id: "l1" }, terms: [], mastery: {}, previously_tapped: [] };
    const fetchImpl = fakeFetch(200, pack);
    const api = createHttpClassApi("http://api", async () => "tok", fetchImpl);
    expect(await api.classPack("l1")).toEqual(pack);
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toBe("http://api/api/lessons/l1/class-pack");
  });

  it("ends the class by posting the word states", async () => {
    const fetchImpl = fakeFetch(200, { ok: true, autonomy: 0.5 });
    const api = createHttpClassApi("http://api", async () => "tok", fetchImpl);
    await api.endClass("s1", [{ lemma: "déchet", state: "yellow" }]);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://api/api/sessions/s1/word-states");
    expect(JSON.parse(init.body as string)).toEqual({ states: [{ lemma: "déchet", state: "yellow" }] });
  });

  it("knows whether the student is signed in", async () => {
    expect(await createHttpClassApi("http://api", async () => "tok", fakeFetch()).isSignedIn()).toBe(true);
    expect(await createHttpClassApi("http://api", async () => null, fakeFetch()).isSignedIn()).toBe(false);
  });

  it("throws on a non-2xx response", async () => {
    const api = createHttpClassApi("http://api", async () => "tok", fakeFetch(500));
    await expect(api.uploadClip(clip)).rejects.toThrow();
    await expect(api.postLost({ sessionId: "s1", tSec: 1, tStart: 0, transcript: "" })).rejects.toThrow();
  });
});

describe("createMockClassApi", () => {
  it("records clips and lost moments returned by list()", async () => {
    const api = createMockClassApi(() => "blob:fake");
    const sessionId = await api.startSession("lesson");
    await api.uploadClip({ ...clip, sessionId });
    await api.postLost({ sessionId, tSec: 100, tStart: 40, transcript: "salut" });
    expect(api.list()).toEqual([
      { kind: "clip", audioUrl: "blob:fake", tStart: 3, tEnd: 13, transcript: "bonjour" },
      { kind: "lost", tStart: 40, tEnd: 100, transcript: "salut" },
    ]);
  });
});

describe("classApiMode", () => {
  it("is http only when NEXT_PUBLIC_CLASS_API is http", () => {
    expect(classApiMode("http")).toBe("http");
    expect(classApiMode(undefined)).toBe("mock");
    expect(classApiMode("mock")).toBe("mock");
  });
});
