import type { PracticeWord } from "./exercises/types";

/** A word the student marked, ready for the exercises. `glossary_lemma` null = not practicable on the API. */
export type MyWord = PracticeWord & { glossary_lemma: string | null; clip_id: string | null };
