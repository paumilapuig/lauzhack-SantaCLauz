import { describe, expect, it, vi } from "vitest";
import { createHttpClassApi, createMockClassApi } from "./classApi";

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
