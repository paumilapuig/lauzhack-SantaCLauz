export type Segment = { text: string; lemma?: string };
export type Token = { start: number; end: number; norm: string };

export const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function tokenize(text: string): Token[] {
  return [...text.matchAll(/\p{L}+/gu)].map((m) => ({
    start: m.index,
    end: m.index + m[0].length,
    norm: normalize(m[0]),
  }));
}

function matchTermAt(tokens: Token[], i: number, termWords: string[]): boolean {
  return termWords.every((w, k) => tokens[i + k]?.norm.startsWith(w));
}

export function splitByTerms(transcript: string, terms: string[]): Segment[] {
  const tokens = tokenize(transcript);
  const parsed = terms.map((t) => ({ lemma: t, words: tokenize(t).map((x) => x.norm) }));
  const segments: Segment[] = [];
  let cursor = 0;
  for (let i = 0; i < tokens.length; i++) {
    const hit = parsed.find((p) => p.words.length > 0 && matchTermAt(tokens, i, p.words));
    if (!hit) continue;
    const last = tokens[i + hit.words.length - 1];
    if (tokens[i].start > cursor) segments.push({ text: transcript.slice(cursor, tokens[i].start) });
    segments.push({ text: transcript.slice(tokens[i].start, last.end), lemma: hit.lemma });
    cursor = last.end;
    i += hit.words.length - 1;
  }
  if (cursor < transcript.length) segments.push({ text: transcript.slice(cursor) });
  return segments;
}
