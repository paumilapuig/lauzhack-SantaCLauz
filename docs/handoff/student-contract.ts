// Types mirror docs/API.md on main (HomeReview, marks, practice, progress, concept gaps).
// Proposed replacement for web/lib/student-contract.ts.

export type HomeClip = {
  id: string;
  lesson_title: string;
  created_at: string;
  t_start: number;
  t_end: number;
  transcript: string;
  audio_url: string; // signed URL, expires after 1 hour
  terms: string[]; // glossary LEMMAS found in the transcript (not surface forms)
  kind: "word" | "concept";
  lemma: string | null;
};

// One item per word marked at home. Non-glossary words: lemma/translation_es/definition_fr/level are null.
export type WordToPractice = {
  word: string; // surface form as tapped, lowercase
  lemma: string | null;
  translation_es: string | null;
  definition_fr: string | null;
  key_phrase: string;
  level: number | null;
  clip_id: string;
};

export type ConceptStep = { fr: string; es: string; visual: string };

// The correct answer is never sent to the student.
export type ConceptExercise = { question: string; options: string[] };

export type ConceptGap = {
  id: string;
  lesson_title: string;
  concept: string;
  lemmas: string[];
  explanation: ConceptStep[]; // 3 to 5 steps
  exercises: ConceptExercise[]; // 2 to 3 questions, 2 to 4 options each
  status: "pending" | "review";
};

export type HomeReview = {
  clips: HomeClip[];
  words_to_practice: WordToPractice[];
  concepts_to_learn: ConceptGap[];
};

export type MarkResult = { word: string; lemma: string | null; translation_es: string | null; level: number | null };
export type UnmarkResult = { ok: boolean; level: number | null };

export type PracticeRequest = { lemma: string; clip_id: string | null; passed: boolean };
export type PracticeResponse = { lemma: string; level: number; leveled_up: boolean };

export type ProgressKind = "learned_this_week" | "no_help_needed" | "keep_going";
export type ProgressMessage = { kind: ProgressKind; text: string };
export type ProgressResponse = { messages: ProgressMessage[] };

export type ConceptAnswersRequest = { answers: number[] };
export type ConceptAnswersResponse = { correct: boolean[]; status: "understood" | "review" };
