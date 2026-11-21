import { normalize, tokenize } from "./transcript";

export type BlankedPhrase = { before: string; after: string; answerForm: string };

function findWord(keyPhrase: string, prefix: string) {
  return tokenize(keyPhrase).find((t) => t.norm.startsWith(normalize(prefix)));
}

export function blankPhrase(keyPhrase: string, lemma: string): BlankedPhrase {
  // shortcut: forms list not in HomeReview, so fall back to the lemma stem
  const hit = findWord(keyPhrase, lemma) ?? findWord(keyPhrase, lemma.slice(0, -2));
  if (!hit) return { before: keyPhrase, after: "", answerForm: lemma };
  return {
    before: keyPhrase.slice(0, hit.start),
    after: keyPhrase.slice(hit.end),
    answerForm: keyPhrase.slice(hit.start, hit.end),
  };
}

export function optionsFor(lemma: string, distractors: string[]): string[] {
  const others = distractors.filter((d, i) => d !== lemma && distractors.indexOf(d) === i).slice(0, 2);
  const position = [...lemma].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 3;
  return [...others.slice(0, position), lemma, ...others.slice(position)];
}

export function heardMatches(heard: string, lemma: string): boolean {
  const target = normalize(lemma);
  return tokenize(heard).some((t) => t.norm.startsWith(target));
}
