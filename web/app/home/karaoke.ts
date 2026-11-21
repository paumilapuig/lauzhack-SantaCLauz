import { tokenize } from "./transcript"

/** Start offset of the word being spoken at character `char` (null when nothing is playing). */
export function activeWordStart(text: string, char: number | null): number | null {
  if (char === null) return null
  let start: number | null = null
  for (const token of tokenize(text)) {
    if (token.start > char) break
    start = token.start
  }
  return start
}

/** Start offset of the word at `ratio` (0–1) of the text, so playback resumes on a whole word. */
export function wordStartAt(text: string, ratio: number): number {
  const char = Math.min(text.length - 1, Math.max(0, Math.round(ratio * text.length)))
  return activeWordStart(text, char) ?? 0
}
