// Types mirror docs/API.md: HomeReview, POST /api/practice, GET /api/me/progress.
export type HomeClip = {
  id: string;
  lesson_title: string;
  created_at: string;
  t_start: number;
  t_end: number;
  transcript: string;
  audio_url: string;
  terms: string[];
};

export type WordToPractice = {
  lemma: string;
  translation_es: string;
  definition_fr: string;
  key_phrase: string;
  level: number;
  clip_id: string | null;
};

export type HomeReview = { clips: HomeClip[]; words_to_practice: WordToPractice[] };

export type PracticeRequest = { lemma: string; clip_id: string | null; passed: boolean };
export type PracticeResponse = { lemma: string; level: number; leveled_up: boolean };

export type ProgressKind = "learned_this_week" | "no_help_needed" | "keep_going";
export type ProgressMessage = { kind: ProgressKind; text: string };
