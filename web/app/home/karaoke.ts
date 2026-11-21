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

const SYLLABLE_MS = 170 // a French TTS voice says ~6 syllables per second at rate 1
const WORD_GAP_MS = 30
const PAUSE_MS: [RegExp, number][] = [
  [/[.!?…]/, 450],
  [/[:;]/, 300],
  [/,/, 200],
]

// Spoken syllables ≈ vowel groups, minus the silent final "e/es/ent" of French; elided "l'", "d'" take none
function syllables(word: string): number {
  const groups = word.match(/[aeiouyàâäéèêëîïôöûùüœæ]+/gi)?.length ?? 0
  const silentEnd = groups > 1 && /[^aeiouy](e|es|ent)$/i.test(word)
  return groups - (silentEnd ? 1 : 0)
}

export type TimedWord = { start: number; at: number }

/** Expected start time (ms from the first sound) of every word, from syllables and punctuation pauses. */
export function timeline(text: string, rate: number): { words: TimedWord[]; total: number } {
  const tokens = tokenize(text)
  const words: TimedWord[] = []
  let t = 0
  tokens.forEach((token, i) => {
    words.push({ start: token.start, at: t })
    const between = text.slice(token.end, tokens[i + 1]?.start ?? text.length)
    const pause = PAUSE_MS.find(([mark]) => mark.test(between))?.[1] ?? 0
    const count = syllables(text.slice(token.start, token.end))
    t += count === 0 ? 0 : (count * SYLLABLE_MS + WORD_GAP_MS + pause) / rate
  })
  return { words, total: t }
}
