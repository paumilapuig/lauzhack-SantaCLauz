import type { WordState } from "./contract";

export type MatchTerm = { lemma: string; forms: string[]; transparent: boolean };
export type Mastery = { levels: Record<string, number>; previouslyTapped: string[] };

const KNOWN_LEVEL = 2;
const TRANSPARENT_LEVEL = 3;

/** docs/API.md › Rules › State shown in class (mirror of api/app/mastery.py). */
export function stateFor(term: MatchTerm, mastery: Mastery): WordState {
  const level = mastery.levels[term.lemma] ?? (term.transparent ? TRANSPARENT_LEVEL : 0);
  if (level >= KNOWN_LEVEL) return "green";
  return mastery.previouslyTapped.includes(term.lemma) ? "orange" : "yellow";
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function formRegex(form: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(form)}(?![\\p{L}\\p{N}])`, "giu");
}

/**
 * Glossary lemmas found in `text`, in reading order (docs/API.md › Rules › Matching in the browser):
 * lowercase, forms longest-first so multi-word forms win, word boundaries, `l'`/`d'` split off.
 */
export function matchLemmas(text: string, terms: MatchTerm[]): string[] {
  const lower = text.toLocaleLowerCase("fr").replace(/\b([ld])['’]/g, "$1 ");
  const forms = terms
    .flatMap((term) => term.forms.map((form) => ({ form: form.toLocaleLowerCase("fr"), lemma: term.lemma })))
    .sort((a, b) => b.form.length - a.form.length);
  const taken: { start: number; end: number; lemma: string }[] = [];
  for (const { form, lemma } of forms) {
    for (const found of lower.matchAll(formRegex(form))) {
      const start = found.index;
      const end = start + found[0].length;
      if (!taken.some((m) => start < m.end && end > m.start)) taken.push({ start, end, lemma });
    }
  }
  return taken.sort((a, b) => a.start - b.start).map((match) => match.lemma);
}
