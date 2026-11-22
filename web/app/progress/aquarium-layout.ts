import type { ProgressWord } from "@/lib/student-contract"

export type Species = "fish" | "shark" | "jellyfish" | "starfish"
export type Creature = { word: ProgressWord; species: Species; x: number; y: number }
export type Tank = { inTank: Creature[]; outside: ProgressWord[] }

/** At most this many animals swim in the tank, so many words never become clutter. */
export const MAX_IN_TANK = 10
/** Of those, at least this many are words still growing (when she has them). */
const GROWING_SLOTS = 4
const NO_HELP_LEVEL = 2
const SPECIES: Species[] = ["fish", "shark", "jellyfish", "starfish", "fish"]
const SWIM_ROWS = [22, 45, 63]
const SAND_ROW = 84
const STAGES = ["an egg", "a baby", "grown", "fully grown"]

function hash(text: string): number {
  let h = 7
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) >>> 0
  return h
}

/** The same word is always the same animal. */
export function speciesOf(lemma: string): Species {
  return SPECIES[hash(lemma) % SPECIES.length]
}

/** Level 0 an egg, 1 a baby, 2 grown, 3 fully grown. */
export function stageOf(level: number): string {
  return STAGES[Math.min(Math.max(level, 0), 3)]
}

function pick(words: ProgressWord[]): { chosen: ProgressWord[]; rest: ProgressWord[] } {
  const byLevel = (a: ProgressWord, b: ProgressWord) => b.level - a.level
  const learned = words.filter((w) => w.level >= NO_HELP_LEVEL).sort(byLevel)
  const growing = words.filter((w) => w.level < NO_HELP_LEVEL).sort(byLevel)
  const growingTaken = Math.min(growing.length, Math.max(GROWING_SLOTS, MAX_IN_TANK - learned.length))
  const learnedTaken = Math.min(learned.length, MAX_IN_TANK - growingTaken)
  const chosen = [...learned.slice(0, learnedTaken), ...growing.slice(0, growingTaken)]
  const rest = [...learned.slice(learnedTaken), ...growing.slice(growingTaken)]
  return { chosen, rest }
}

function spread(items: { word: ProgressWord; species: Species }[], rows: number[]): Creature[] {
  const perRow = Math.ceil(items.length / rows.length)
  return items.map((item, i) => {
    const row = Math.floor(i / perRow)
    const inRow = Math.min(perRow, items.length - row * perRow)
    const column = i % perRow
    const jitter = (hash(item.word.lemma) % 7) - 3
    const x = ((column + 0.5) / inRow) * 100 + (row % 2 ? 4 : -4) + jitter * 0.6
    return { ...item, x: Math.min(92, Math.max(8, x)), y: rows[row] + (jitter % 3) }
  })
}

/** Which words swim in the tank (learned first, always some still growing) and where. */
export function arrangeTank(words: ProgressWord[]): Tank {
  const { chosen, rest } = pick(words)
  const items = chosen.map((word) => ({ word, species: speciesOf(word.lemma) }))
  const onSand = items.filter((c) => c.word.level <= 0 || c.species === "starfish")
  const swimming = items.filter((c) => !onSand.includes(c))
  const rows = SWIM_ROWS.slice(0, Math.max(1, Math.min(SWIM_ROWS.length, Math.ceil(swimming.length / 3))))
  return { inTank: [...spread(swimming, rows), ...spread(onSand, [SAND_ROW])], outside: rest }
}
