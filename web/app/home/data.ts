import type {
  HomeReview,
  PracticeRequest,
  PracticeResponse,
  ProgressMessage,
} from "@/lib/student-contract";

import type { MyWord } from "./types";

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
      transcript:
        "Les mitochondries utilisent l'oxygène pour transformer le glucose. Cette réaction va libérer de l'énergie pour nos muscles. Elle produit aussi des déchets : de l'eau et du dioxyde de carbone.",
      audio_url: "https://…signed…",
      terms: ["déchet", "dioxyde de carbone"],
    },
    {
      id: "c2…",
      lesson_title: "La respiration cellulaire",
      created_at: "2026-11-21T21:14:00Z",
      t_start: 30.0,
      t_end: 60.0,
      transcript:
        "Le sang transporte ces déchets jusqu'aux poumons, et nous les rejetons quand on expire. Une partie de l'énergie se dégage sous forme de chaleur : c'est pour ça qu'on a chaud quand on court.",
      audio_url: "https://…signed…",
      terms: ["déchet", "chaleur"],
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
    {
      lemma: "chaleur",
      translation_es: "calor",
      definition_fr: "Ce qui rend chaud.",
      key_phrase: "Une partie de l'énergie se dégage sous forme de chaleur : c'est pour ça qu'on a chaud quand on court.",
      level: 1,
      clip_id: "c2…",
    },
    {
      lemma: "essoufflé",
      translation_es: "sin aliento",
      definition_fr: "Qui respire vite et fort après un effort.",
      key_phrase: "Quand on court vite, on est essoufflé, parce que les muscles demandent plus d'oxygène.",
      level: 0,
      clip_id: null,
    },
  ],
};

const levels = new Map(FAKE_REVIEW.words_to_practice.map((w) => [w.lemma, w.level]));

const DICTIONARY: Record<string, string> = {
  // content
  mitochondries: "mitocondrias", utilisent: "usan", oxygène: "oxígeno", transformer: "transformar",
  glucose: "glucosa", réaction: "reacción", libérer: "liberar", énergie: "energía", muscles: "músculos",
  produit: "produce", aussi: "también", déchets: "desechos", eau: "agua", dioxyde: "dióxido",
  carbone: "carbono", sang: "sangre", transporte: "transporta", poumons: "pulmones",
  rejetons: "expulsamos", expire: "espira", partie: "parte", dégage: "se desprende", forme: "forma",
  chaleur: "calor", chaud: "calor", court: "corre",
  // function / glue words — every surface form in the demo clips is tappable
  les: "los", le: "el", la: "la", l: "el", de: "de", des: "unos", du: "del", et: "y",
  pour: "para", nos: "nuestros", nous: "nosotros", cette: "esta", ces: "estos", elle: "ella",
  va: "va", se: "se", c: "esto", est: "es", qu: "que", on: "uno", a: "tiene", quand: "cuando",
  jusqu: "hasta", aux: "a los", une: "una", un: "un", ça: "eso", sous: "bajo",
};

/** Spanish gloss for a surface form. Always returns a string so every word is tappable. */
export function translate(word: string): string {
  return DICTIONARY[word.toLowerCase()] ?? "…";
}

// demo seed: words marked at home earlier, keyed by the surface form that appears in the transcripts
const SEED_FORMS: Record<string, string> = { déchet: "déchets" };
const marks: MyWord[] = FAKE_REVIEW.words_to_practice.map((w) => {
  const form = SEED_FORMS[w.lemma] ?? w.lemma;
  // same translation the clip shows for that form
  return { ...w, lemma: form, translation_es: DICTIONARY[form] ?? w.translation_es };
});

const sentenceWith = (transcript: string, word: string) =>
  transcript.split(/(?<=[.!?])\s+/).find((s) => s.toLowerCase().includes(word)) ?? transcript;

// shortcut: in-memory marks until owner A adds an endpoint, then swap for request<T>()
export async function saveMark(word: string, clipId: string): Promise<void> {
  const lemma = word.toLowerCase();
  const clip = FAKE_REVIEW.clips.find((c) => c.id === clipId);
  if (!clip || marks.some((m) => m.lemma === lemma)) return;
  const gloss = translate(lemma);
  marks.push({
    lemma,
    translation_es: gloss === "…" ? "" : gloss,
    definition_fr: "",
    key_phrase: sentenceWith(clip.transcript, lemma),
    level: 0,
    clip_id: clipId,
  });
}

export async function removeMark(lemma: string): Promise<void> {
  const index = marks.findIndex((m) => m.lemma === lemma);
  if (index >= 0) marks.splice(index, 1);
}

export async function getMyWords(): Promise<MyWord[]> {
  return structuredClone(marks);
}

// shortcut: fake data until owner B's endpoint exists, then swap body for request<T>()
export async function getHomeReview(): Promise<HomeReview> {
  return structuredClone(FAKE_REVIEW);
}

// shortcut: fake data until owner B's endpoint exists, then swap body for request<T>()
export async function savePractice(req: PracticeRequest): Promise<PracticeResponse> {
  const current = levels.get(req.lemma) ?? 0;
  const level = req.passed ? Math.min(current + 1, MAX_LEVEL) : current;
  levels.set(req.lemma, level);
  return { lemma: req.lemma, level, leveled_up: level > current };
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
