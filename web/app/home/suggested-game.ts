import type { WordToPractice } from "@/lib/student-contract"

const MAX_FOCUS_WORDS = 3

// Level 0: meet the word first. Level 1+: use it in context and say it.
const FIRST_MEETING = ["flashcards", "match-pairs", "dictation", "unscramble", "true-false", "step-by-step", "order-phrase"]
const ALREADY_SEEN = ["step-by-step", "match-pairs", "true-false", "dictation", "unscramble", "order-phrase", "flashcards"]

const levelOf = (w: WordToPractice) => w.level ?? 0

/** The words that need help the most: lowest level first, one per lemma. */
export function focusWords(words: WordToPractice[]): WordToPractice[] {
  const seen = new Set<string>()
  const unique = words.filter((w) => {
    const key = w.lemma ?? w.word
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return unique
    .map((w, order) => ({ w, order }))
    .sort((a, b) => levelOf(a.w) - levelOf(b.w) || a.order - b.order)
    .slice(0, MAX_FOCUS_WORDS)
    .map(({ w }) => w)
}

/** The game Loop'd recommends now: fits the weakest words' level, not played yet today. */
export function suggestedGame(words: WordToPractice[], isAvailable: (modeId: string) => boolean, playedToday: string[]): string | null {
  const focus = focusWords(words)
  if (focus.length === 0) return null
  const order = Math.min(...focus.map(levelOf)) === 0 ? FIRST_MEETING : ALREADY_SEEN
  return order.find((id) => !playedToday.includes(id) && isAvailable(id)) ?? null
}
