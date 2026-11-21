import { normalize } from "../transcript";

export const spellingMatches = (typed: string, lemma: string) => normalize(typed.trim()) === normalize(lemma);
