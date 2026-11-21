import type { ClipUpload, LostEventRequest, LostMoment, StartSessionResponse } from "@/lib/contract";
import { ApiError, type TokenProvider } from "@/lib/api";

export interface ClassApi {
  startSession(lessonId: string): Promise<string>;
  uploadClip(clip: ClipUpload): Promise<void>;
  postLost(moment: LostMoment): Promise<void>;
}

export type SavedItem =
  | { kind: "clip"; audioUrl: string; tStart: number; tEnd: number; transcript: string }
  | { kind: "lost"; tStart: number; tEnd: number; transcript: string };

export type MockClassApi = ClassApi & { list(): SavedItem[] };

export function createMockClassApi(
  toObjectUrl: (blob: Blob) => string = (blob) => URL.createObjectURL(blob),
): MockClassApi {
  const items: SavedItem[] = [];
  return {
    async startSession() {
      return "mock-session";
    },
    async uploadClip({ blob, tStart, tEnd, transcript }) {
      items.push({ kind: "clip", audioUrl: toObjectUrl(blob), tStart, tEnd, transcript });
    },
    async postLost({ tSec, tStart, transcript }) {
      items.push({ kind: "lost", tStart, tEnd: tSec, transcript });
    },
    list: () => [...items],
  };
}

export function createHttpClassApi(
  baseUrl: string,
  getToken: TokenProvider,
  fetchImpl: typeof fetch = fetch,
): ClassApi {
  async function send(path: string, body: BodyInit, contentType?: string): Promise<Response> {
    const headers = new Headers();
    const token = await getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (contentType) headers.set("Content-Type", contentType);
    const response = await fetchImpl(`${baseUrl}${path}`, { method: "POST", headers, body });
    if (!response.ok) throw new ApiError(response.status, `POST ${path} failed with ${response.status}`);
    return response;
  }

  const sendJson = (path: string, payload: unknown) =>
    send(path, JSON.stringify(payload), "application/json");

  return {
    async startSession(lessonId) {
      const response = await sendJson("/api/sessions", { lesson_id: lessonId });
      return ((await response.json()) as StartSessionResponse).session_id;
    },
    async uploadClip({ sessionId, blob, tStart, tEnd, transcript }) {
      const form = new FormData();
      form.set("audio", blob, "clip.webm");
      form.set("session_id", sessionId);
      form.set("t_start", String(tStart));
      form.set("t_end", String(tEnd));
      form.set("transcript", transcript);
      await send("/api/clips", form);
    },
    async postLost({ sessionId, tSec, tStart, transcript }) {
      const event: LostEventRequest = {
        t_sec: tSec,
        type: "lost",
        lemma: null,
        context: { t_start: tStart, transcript },
      };
      await sendJson(`/api/sessions/${sessionId}/events`, event);
    },
  };
}

async function getAccessToken(): Promise<string | null> {
  const { createClient } = await import("@/lib/supabase/client");
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? null;
}

export function getClassApi(): ClassApi {
  if (process.env.NEXT_PUBLIC_CLASS_API === "http") {
    return createHttpClassApi(
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
      getAccessToken,
    );
  }
  return createMockClassApi();
}
