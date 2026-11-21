export type WordState = "green" | "yellow" | "orange";

export interface LessonTermInput {
  lemma: string;
  forms: string[];
  translation_es: string;
  transparent: boolean;
}

export interface Mastery {
  levels: Record<string, number>;
  previouslyTapped: string[];
}

export interface Match {
  start: number;
  end: number;
  lemma: string;
}

export interface Segment {
  text: string;
  lemma: string | null;
  state: WordState | null;
  translationEs: string | null;
}

const KNOWN_LEVEL = 2;
const TRANSPARENT_LEVEL = 3;

export function stateFor(term: LessonTermInput, mastery: Mastery): WordState {
  const level = mastery.levels[term.lemma] ?? (term.transparent ? TRANSPARENT_LEVEL : 0);
  if (level >= KNOWN_LEVEL) return "green";
  return mastery.previouslyTapped.includes(term.lemma) ? "orange" : "yellow";
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function formsLongestFirst(terms: LessonTermInput[]): { form: string; lemma: string }[] {
  return terms
    .flatMap((t) => t.forms.map((form) => ({ form: form.toLocaleLowerCase("fr"), lemma: t.lemma })))
    .sort((a, b) => b.form.length - a.form.length);
}

function formRegex(form: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(form)}(?![\\p{L}\\p{N}])`, "giu");
}

const overlaps = (taken: Match[], start: number, end: number) =>
  taken.some((m) => start < m.end && end > m.start);

export function matchTranscript(text: string, terms: LessonTermInput[]): Match[] {
  const lower = text.toLocaleLowerCase("fr");
  const taken: Match[] = [];
  for (const { form, lemma } of formsLongestFirst(terms)) {
    for (const found of lower.matchAll(formRegex(form))) {
      const start = found.index;
      const end = start + found[0].length;
      if (!overlaps(taken, start, end)) taken.push({ start, end, lemma });
    }
  }
  return taken.sort((a, b) => a.start - b.start);
}

const plain = (text: string): Segment => ({ text, lemma: null, state: null, translationEs: null });

export function segment(text: string, terms: LessonTermInput[], mastery: Mastery): Segment[] {
  const byLemma = new Map(terms.map((t) => [t.lemma, t]));
  const segments: Segment[] = [];
  let cursor = 0;
  for (const { start, end, lemma } of matchTranscript(text, terms)) {
    if (start > cursor) segments.push(plain(text.slice(cursor, start)));
    const term = byLemma.get(lemma)!;
    const state = stateFor(term, mastery);
    segments.push({
      text: text.slice(start, end),
      lemma,
      state,
      translationEs: state === "yellow" ? term.translation_es : null,
    });
    cursor = end;
  }
  if (cursor < text.length) segments.push(plain(text.slice(cursor)));
  return segments;
}
