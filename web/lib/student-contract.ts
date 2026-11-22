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
  word: string;
  lemma: string | null;
  translation_es: string | null;
  definition_fr: string | null;
  key_phrase: string;
  level: number | null;
  clip_id: string | null;
};

export type MarkResult = { word: string; lemma: string | null; translation_es: string | null; level: number | null };

export type DiagramNode = { id: string; fr: string; kind: "input" | "process" | "output" | "place"; inside: string | null };
export type DiagramLink = { from: string; to: string; fr: string | null };
export type WordGloss = { fr: string; es: string };
/** docs/API.md › Concept gaps: older rows have no nodes/links/words, newer ones have no visual. */
export type ConceptStep = { fr: string; es: string; visual?: string; nodes?: DiagramNode[]; links?: DiagramLink[]; words?: WordGloss[] };
export type ConceptWordResult = { word: string; lemma: string | null; translation_es: string | null; level: number | null };
export type ConceptQuestion = { question: string; options: string[] };
export type ConceptGap = {
  id: string;
  lesson_title: string;
  concept: string;
  lemmas: string[];
  explanation: ConceptStep[];
  exercises: ConceptQuestion[];
  status: "pending" | "review";
};
export type ConceptAnswerResult = { correct: boolean[]; status: "understood" | "review" };

export type HomeReview = { clips: HomeClip[]; words_to_practice: WordToPractice[]; concepts_to_learn?: ConceptGap[] };

export type PracticeRequest = { lemma: string; clip_id: string | null; passed: boolean };
export type PracticeResponse = { lemma: string; level: number; leveled_up: boolean };

export type ProgressKind = "learned_this_week" | "no_help_needed" | "keep_going";
export type ProgressMessage = { kind: ProgressKind; text: string };
