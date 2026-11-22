import type { WordGloss } from "@/lib/student-contract"

/** A piece of French text: words carry `word` (lowercase, what is saved), the rest is shown as it is. */
export type Piece = { text: string; word?: string }

const WORD = /\p{L}+['’]?/gu

/** Split French text into tappable words and plain gaps; `l'énergie` gives `l'` and `énergie`. */
export function splitWords(text: string): Piece[] {
  const pieces: Piece[] = []
  let cursor = 0
  for (const match of text.matchAll(WORD)) {
    if (match.index > cursor) pieces.push({ text: text.slice(cursor, match.index) })
    pieces.push({ text: match[0], word: match[0].replace("’", "'").toLocaleLowerCase("fr") })
    cursor = match.index + match[0].length
  }
  if (cursor < text.length) pieces.push({ text: text.slice(cursor) })
  return pieces
}

/** Spanish for a tapped word from the step's glossary: exact entry first, else an entry that contains it. */
export function glossFor(word: string, words: WordGloss[]): string | null {
  const lower = (s: string) => s.toLocaleLowerCase("fr")
  const exact = words.find((w) => lower(w.fr) === word)
  if (exact) return exact.es
  const within = words.find((w) => lower(w.fr).split(/[\s'’]+/).includes(word))
  return within ? within.es : null
}
