// Same split as concept-diagram/words.ts: `l'énergie` gives `l'` and `énergie`.
const WORD = /\p{L}+['’]?/gu

/** The word of `text` at `offset` (a click lands on a letter or right after the word). */
export function wordAt(text: string, offset: number): { start: number; end: number } | null {
  for (const match of text.matchAll(WORD)) {
    const start = match.index
    const end = start + match[0].replace(/['’]$/, "").length
    if (offset >= start && offset <= end) return { start, end }
    if (start > offset) break
  }
  return null
}
