import type {
  ClassPack,
  ClipUpload,
  LessonSummary,
  LostEventRequest,
  LostMoment,
  StartSessionResponse,
  WordStatesRequest,
} from "@/lib/contract";
import { ApiError, type TokenProvider } from "@/lib/api";
import { apiMode } from "@/lib/apiMode";

export interface ClassApi {
  isSignedIn(): Promise<boolean>;
  latestLessonId(): Promise<string>;
  classPack(lessonId: string): Promise<ClassPack>;
  startSession(lessonId: string): Promise<string>;
  uploadClip(clip: ClipUpload): Promise<void>;
  postLost(moment: LostMoment): Promise<void>;
  endClass(sessionId: string, states: WordStatesRequest["states"]): Promise<void>;
}

const MOCK_LESSON: ClassPack = {
  lesson: { id: "demo-lesson", title: "Demo", subject: null, lesson_date: null },
  terms: [],
  mastery: {},
  previously_tapped: [],
};

export type SavedItem =
  | { kind: "clip"; audioUrl: string; tStart: number; tEnd: number; transcript: string }
  | { kind: "lost"; tStart: number; tEnd: number; transcript: string };

export type MockClassApi = ClassApi & { list(): SavedItem[] };

export function createMockClassApi(
  toObjectUrl: (blob: Blob) => string = (blob) => URL.createObjectURL(blob),
): MockClassApi {
  const items: SavedItem[] = [];
  return {
    async isSignedIn() {
      return true;
    },
    async latestLessonId() {
      return MOCK_LESSON.lesson.id;
    },
    async classPack() {
      return MOCK_LESSON;
    },
    async startSession() {
      return "mock-session";
    },
    async endClass() {},
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
  async function request(method: "GET" | "POST", path: string, body?: BodyInit, contentType?: string) {
    const headers = new Headers();
    const token = await getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (contentType) headers.set("Content-Type", contentType);
    const response = await fetchImpl(`${baseUrl}${path}`, { method, headers, body });
    if (!response.ok) throw new ApiError(response.status, `${method} ${path} failed with ${response.status}`);
    return response;
  }

  const send = (path: string, body: BodyInit) => request("POST", path, body);
  const sendJson = (path: string, payload: unknown) =>
    request("POST", path, JSON.stringify(payload), "application/json");
  const getJson = async <T,>(path: string) => (await request("GET", path)).json() as Promise<T>;

  return {
    async isSignedIn() {
      return (await getToken()) !== null;
    },
    async latestLessonId() {
      const [newest] = await getJson<LessonSummary[]>("/api/lessons");
      if (!newest) throw new Error("No lesson yet");
      return newest.id;
    },
    classPack(lessonId) {
      return getJson<ClassPack>(`/api/lessons/${lessonId}/class-pack`);
    },
    async endClass(sessionId, states) {
      const body: WordStatesRequest = { states };
      await sendJson(`/api/sessions/${sessionId}/word-states`, body);
    },
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

export const classApiMode = apiMode;

export function getClassApi(): ClassApi {
  if (classApiMode() === "http") {
    return createHttpClassApi(
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
      getAccessToken,
    );
  }
  return createMockClassApi();
}
