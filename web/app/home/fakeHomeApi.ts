import type { HomeReview, MarkResult, WordToPractice } from "@/lib/student-contract";
import type { HomeApi } from "./homeApi";
import { FAKE_CONCEPT, FAKE_CONCEPT_ANSWERS, fakeConceptWord } from "./fakeConcept";

// Demo data for when the web runs without the API (NEXT_PUBLIC_CLASS_API is not "http").
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
      word: "déchets",
      lemma: "déchet",
      translation_es: "desecho",
      definition_fr: "Ce qui reste et ne sert plus.",
      key_phrase: "Elle produit aussi des déchets : de l'eau et du dioxyde de carbone.",
      level: 0,
      clip_id: "c1…",
    },
    {
      word: "chaleur",
      lemma: "chaleur",
      translation_es: "calor",
      definition_fr: "Ce qui rend chaud.",
      key_phrase: "Une partie de l'énergie se dégage sous forme de chaleur : c'est pour ça qu'on a chaud quand on court.",
      level: 1,
      clip_id: "c2…",
    },
    {
      word: "essoufflé",
      lemma: "essoufflé",
      translation_es: "sin aliento",
      definition_fr: "Qui respire vite et fort après un effort.",
      key_phrase: "Quand on court vite, on est essoufflé, parce que les muscles demandent plus d'oxygène.",
      level: 0,
      clip_id: null,
    },
  ],
  concepts_to_learn: [FAKE_CONCEPT],
};

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

const MAX_LEVEL = 3;
const NO_HELP_LEVEL = 2;

const sentenceWith = (transcript: string, word: string) =>
  transcript.split(/(?<=[.!?])\s+/).find((s) => s.toLowerCase().includes(word)) ?? transcript;

/** In-memory HomeApi: same behaviour as the real API, nothing leaves the browser. */
export function createFakeHomeApi(): HomeApi {
  const review: HomeReview = structuredClone(FAKE_REVIEW);
  const levels = new Map(review.words_to_practice.map((w) => [w.lemma ?? w.word, w.level ?? 0]));

  return {
    async review() {
      // like the API: glossary words with level ≥ 2 no longer need practice
      const words = review.words_to_practice.filter((w) => (w.level ?? 0) < NO_HELP_LEVEL);
      return structuredClone({ ...review, words_to_practice: words });
    },
    async mark(clipId, word): Promise<MarkResult> {
      const surface = word.toLowerCase();
      const clip = review.clips.find((c) => c.id === clipId);
      const translation = DICTIONARY[surface] ?? null;
      if (clip && !review.words_to_practice.some((w) => w.word === surface && w.clip_id === clipId)) {
        const entry: WordToPractice = {
          word: surface, lemma: surface, translation_es: translation, definition_fr: null,
          key_phrase: sentenceWith(clip.transcript, surface), level: 0, clip_id: clipId,
        };
        review.words_to_practice.unshift(entry);
      }
      return { word: surface, lemma: surface, translation_es: translation, level: 0 };
    },
    async unmark(clipId, word) {
      review.words_to_practice = review.words_to_practice.filter((w) => !(w.word === word && w.clip_id === clipId));
    },
    async finishClip(clipId) {
      review.clips = review.clips.filter((c) => c.id !== clipId);
    },
    async practice({ lemma, passed }) {
      const current = levels.get(lemma) ?? 0;
      const level = passed ? Math.min(current + 1, MAX_LEVEL) : current;
      levels.set(lemma, level);
      for (const w of review.words_to_practice) if ((w.lemma ?? w.word) === lemma) w.level = level;
      return { lemma, level, leveled_up: level > current };
    },
    async answerConcept(_conceptId, answers) {
      const correct = answers.map((answer, i) => answer === FAKE_CONCEPT_ANSWERS[i]);
      const status = correct.every(Boolean) ? "understood" : "review";
      if (status === "understood") review.concepts_to_learn = [];
      return { correct, status };
    },
    async markConceptWord(_conceptId, word) {
      return fakeConceptWord(word);
    },
    async progress() {
      return {
        messages: [
          { kind: "learned_this_week", text: "This week you learned 12 new words" },
          { kind: "no_help_needed", text: "You no longer need help with «mitochondrie»" },
          { kind: "keep_going", text: "Keep going: tomorrow we review «déchet»" },
        ],
      };
    },
  };
}
