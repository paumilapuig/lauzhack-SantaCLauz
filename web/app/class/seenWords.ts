import type { WordState } from "@/lib/contract";
import { matchLemmas, stateFor, type MatchTerm } from "@/lib/wordState";

export type ClassPackWords = {
  terms: MatchTerm[];
  mastery: Record<string, number>;
  previously_tapped: string[];
};

export type SeenState = { lemma: string; state: WordState };

/** Remembers each glossary word that came up in class and the first state it had (sent at end of class). */
export function createSeenWords(pack: ClassPackWords) {
  const byLemma = new Map(pack.terms.map((term) => [term.lemma, term]));
  const mastery = { levels: pack.mastery, previouslyTapped: pack.previously_tapped };
  const seen = new Map<string, WordState>();

  return {
    add(text: string) {
      for (const lemma of matchLemmas(text, pack.terms)) {
        if (!seen.has(lemma)) seen.set(lemma, stateFor(byLemma.get(lemma)!, mastery));
      }
    },
    states(): SeenState[] {
      return [...seen].map(([lemma, state]) => ({ lemma, state }));
    },
  };
}

export type SeenWords = ReturnType<typeof createSeenWords>;
