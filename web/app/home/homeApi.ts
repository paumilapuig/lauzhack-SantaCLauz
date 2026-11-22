import type {
  ConceptAnswerResult,
  ConceptWordResult,
  HomeReview,
  MarkResult,
  PracticeRequest,
  PracticeResponse,
  ProgressMessage,
  WordToPractice,
} from "@/lib/student-contract";
import type { MyWord } from "./types";

export interface HomeApi {
  review(): Promise<HomeReview>;
  mark(clipId: string, word: string): Promise<MarkResult>;
  unmark(clipId: string, word: string): Promise<void>;
  finishClip(clipId: string): Promise<void>;
  practice(request: PracticeRequest): Promise<PracticeResponse>;
  progress(): Promise<{ messages: ProgressMessage[] }>;
  answerConcept(conceptId: string, answers: number[]): Promise<ConceptAnswerResult>;
  markConceptWord(conceptId: string, word: string, keyPhrase: string): Promise<ConceptWordResult>;
}

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export function createHttpHomeApi(request: Request): HomeApi {
  const post = (body?: unknown): RequestInit => (body === undefined ? { method: "POST" } : { method: "POST", body: JSON.stringify(body) });
  return {
    review: () => request<HomeReview>("/api/home/review"),
    mark: (clipId, word) => request<MarkResult>(`/api/clips/${clipId}/marks`, post({ word })),
    async unmark(clipId, word) {
      await request(`/api/clips/${clipId}/marks/${encodeURIComponent(word)}`, { method: "DELETE" });
    },
    async finishClip(clipId) {
      await request(`/api/clips/${clipId}/reviewed`, post());
    },
    practice: (body) => request<PracticeResponse>("/api/practice", post(body)),
    progress: () => request<{ messages: ProgressMessage[] }>("/api/me/progress"),
    answerConcept: (conceptId, answers) => request<ConceptAnswerResult>(`/api/concepts/${conceptId}/answers`, post({ answers })),
    markConceptWord: (conceptId, word, keyPhrase) =>
      request<ConceptWordResult>(`/api/concepts/${conceptId}/words`, post({ word, key_phrase: keyPhrase })),
  };
}

/** API word → exercise word: glossary lemma when known, empty strings for missing texts. */
export function toMyWord(word: WordToPractice): MyWord {
  return {
    lemma: word.lemma ?? word.word,
    glossary_lemma: word.lemma,
    translation_es: word.translation_es ?? "",
    definition_fr: word.definition_fr ?? "",
    key_phrase: word.key_phrase,
    clip_id: word.clip_id,
  };
}
