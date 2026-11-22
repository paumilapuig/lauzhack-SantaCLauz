// Class-side contract (docs/API.md + proposed P1/P2 in docs/specs/c-class-buttons.md).
export type ClipUpload = {
  sessionId: string;
  blob: Blob;
  tStart: number;
  tEnd: number;
  transcript: string;
};

export type LostMoment = {
  sessionId: string;
  tSec: number;
  tStart: number;
  transcript: string;
};

export type LostEventRequest = {
  t_sec: number;
  type: "lost";
  lemma: null;
  context: { t_start: number; transcript: string };
};

export type StartSessionResponse = { session_id: string };
export type WordState = "green" | "yellow" | "orange";

export type LessonSummary = { id: string; title: string; subject: string | null; lesson_date: string | null };

export type ClassPackTerm = {
  id: string;
  lesson_id: string;
  lemma: string;
  forms: string[];
  translation_es: string | null;
  definition_fr: string | null;
  transparent: boolean;
  key_phrase: string | null;
};

export type ClassPack = {
  lesson: LessonSummary;
  terms: ClassPackTerm[];
  mastery: Record<string, number>;
  previously_tapped: string[];
};

export type WordStatesRequest = { states: { lemma: string; state: WordState }[] };
