import { shuffle } from "./shuffle";
import type { PracticeWord } from "./types";

export type TrueFalseItem = { lemma: string; definition: string; isTrue: boolean };

/** Even positions show the word's own definition, odd ones another word's. One word: only true items. */
export function buildItems(words: PracticeWord[], seed: number): TrueFalseItem[] {
  const items = words.map((word, i) => {
    const isTrue = words.length < 2 || i % 2 === 0;
    const source = isTrue ? word : words[(i + 1) % words.length];
    return { lemma: word.lemma, definition: source.definition_fr, isTrue };
  });
  return shuffle(items, seed);
}
