import type {
  HomeReview,
  PracticeRequest,
  PracticeResponse,
  ProgressMessage,
} from "@/lib/student-contract";

export const DISTRACTORS = ["chaleur", "nourriture", "fournir", "rejeter", "essoufflé"];

const MAX_LEVEL = 3;

const FAKE_REVIEW: HomeReview = {
  clips: [
    {
      id: "c1…",
      lesson_title: "La respiration cellulaire",
      created_at: "2026-11-21T21:10:00Z",
      t_start: 0.0,
      t_end: 30.0,
      transcript: "… elle produit aussi des déchets …",
      audio_url: "https://…signed…",
      terms: ["déchet", "dioxyde de carbone"],
    },
  ],
  words_to_practice: [
    {
      lemma: "déchet",
      translation_es: "desecho",
      definition_fr: "Ce qui reste et ne sert plus.",
      key_phrase: "Elle produit aussi des déchets : de l'eau et du dioxyde de carbone.",
      level: 0,
      clip_id: "c1…",
    },
  ],
};

const levels = new Map(FAKE_REVIEW.words_to_practice.map((w) => [w.lemma, w.level]));

// shortcut: fake data until owner B's endpoint exists, then swap body for request<T>()
export async function getHomeReview(): Promise<HomeReview> {
  return structuredClone(FAKE_REVIEW);
}

// shortcut: fake data until owner B's endpoint exists, then swap body for request<T>()
export async function savePractice(req: PracticeRequest): Promise<PracticeResponse> {
  const level = Math.min((levels.get(req.lemma) ?? 0) + 1, MAX_LEVEL);
  levels.set(req.lemma, level);
  return { lemma: req.lemma, level, leveled_up: true };
}

// shortcut: fake data until owner B's endpoint exists, then swap body for request<T>()
export async function getProgress(): Promise<{ messages: ProgressMessage[] }> {
  return {
    messages: [
      { kind: "learned_this_week", text: "Esta semana has aprendido 12 palabras nuevas" },
      { kind: "no_help_needed", text: "Ya no necesitas ayuda para mitochondrie" },
      { kind: "keep_going", text: "Sigue así: mañana repasamos déchet" },
    ],
  };
}
