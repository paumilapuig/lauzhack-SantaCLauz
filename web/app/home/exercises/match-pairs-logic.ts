import { shuffle } from "./shuffle";
import type { ExerciseResult, PracticeWord } from "./types";

const MAX_PAIRS = 4;

export type Board = { french: PracticeWord[]; spanish: PracticeWord[] };

export function isPair(frenchLemma: string, spanishLemma: string) {
  return frenchLemma === spanishLemma;
}

export function buildBoard(words: PracticeWord[], seed: number): Board {
  const picked = words.slice(0, MAX_PAIRS);
  return { french: shuffle(picked, seed), spanish: shuffle(picked, seed + 1) };
}

export function buildResults(lemmas: string[], missed: ReadonlySet<string>): ExerciseResult[] {
  return lemmas.map((lemma) => ({ lemma, passed: !missed.has(lemma) }));
}
