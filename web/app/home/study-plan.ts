import type { ConceptGap, HomeClip, WordToPractice } from "@/lib/student-contract"

export type PlanWord = { lemma: string; translation: string }

export type PlanStep =
  | { kind: "clips"; count: number; minutes: number }
  | { kind: "concept"; id: string; concept: string; questions: number; minutes: number }
  | { kind: "practice"; modeId: string; words: PlanWord[]; minutes: number }

/** A step in today's plan; `done` steps stay visible with a check so the student sees her progress. */
export type PlanEntry = PlanStep & { done: boolean }

type PlanInput = {
  clips: HomeClip[]
  concepts: ConceptGap[]
  words: WordToPractice[]
  isAvailable: (modeId: string) => boolean
  /** steps finished today, oldest first */
  completed: PlanStep[]
}

const MAX_CONCEPTS = 2
const MAX_FOCUS_WORDS = 3
const MINUTES = { clip: 1, concept: 3, practice: 2 }

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

/** Identifies a step across reloads: the same clips, idea or game is never offered twice in a day. */
export function stepKey(step: PlanStep): string {
  if (step.kind === "concept") return `concept:${step.id}`
  if (step.kind === "practice") return `practice:${step.modeId}`
  return "clips"
}

function practiceStep(words: WordToPractice[], isAvailable: (modeId: string) => boolean): PlanStep | null {
  const focus = focusWords(words)
  if (focus.length === 0) return null
  const order = Math.min(...focus.map(levelOf)) === 0 ? FIRST_MEETING : ALREADY_SEEN
  const modeId = order.find(isAvailable)
  if (!modeId) return null
  const planWords = focus.map((w) => ({ lemma: w.lemma ?? w.word, translation: w.translation_es ?? "" }))
  return { kind: "practice", modeId, words: planWords, minutes: MINUTES.practice }
}

/**
 * What to study today, in order: clips feed the word games, ideas come next, then practise the weakest words.
 * Finished steps come first, checked; a finished game makes the plan suggest the next one.
 */
export function buildStudyPlan({ clips, concepts, words, isAvailable, completed }: PlanInput): PlanEntry[] {
  const finished = new Set(completed.map(stepKey))
  const todo: PlanStep[] = []
  if (clips.length > 0) todo.push({ kind: "clips", count: clips.length, minutes: clips.length * MINUTES.clip })
  for (const gap of concepts.filter((g) => !finished.has(`concept:${g.id}`)).slice(0, MAX_CONCEPTS)) {
    todo.push({ kind: "concept", id: gap.id, concept: gap.concept, questions: gap.exercises.length, minutes: MINUTES.concept })
  }
  const practice = practiceStep(words, (id) => !finished.has(`practice:${id}`) && isAvailable(id))
  if (practice) todo.push(practice)
  const pending = new Set(todo.map(stepKey))
  const done = completed.filter((step) => !pending.has(stepKey(step)))
  return [...done.map((step) => ({ ...step, done: true })), ...todo.map((step) => ({ ...step, done: false }))]
}

/** Time left: finished steps do not count. */
export const planMinutes = (steps: PlanEntry[]) => steps.filter((s) => !s.done).reduce((total, step) => total + step.minutes, 0)
