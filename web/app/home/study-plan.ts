import type { ConceptGap, HomeClip, WordToPractice } from "@/lib/student-contract"
import { focusWords, suggestedGame } from "./suggested-game"

export type PlanWord = { lemma: string; translation: string }

export type PlanStep =
  | { kind: "clips"; count: number; minutes: number }
  | { kind: "concept"; id: string; concept: string; questions: number; minutes: number }
  | { kind: "practice"; modeId: string; words: PlanWord[]; minutes: number }

/** A step of today's work; `done` steps stay visible with a check so the student sees her progress. */
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
const MINUTES = { clip: 1, concept: 3, practice: 2 }

/** Identifies a step across reloads, so a finished step is never offered again the same day. */
export function stepKey(step: PlanStep): string {
  if (step.kind === "concept") return `concept:${step.id}`
  if (step.kind === "practice") return `practice:${step.modeId}`
  return "clips"
}

/** The plan step a concept card becomes, so understanding it checks the step off. */
export const conceptStep = (gap: ConceptGap): PlanStep => ({
  kind: "concept", id: gap.id, concept: gap.concept, questions: gap.exercises.length, minutes: MINUTES.concept,
})

/** A finished game, whichever list it was opened from. */
export function practiceDone(modeId: string, words: WordToPractice[]): PlanStep {
  const planWords = focusWords(words).map((w) => ({ lemma: w.lemma ?? w.word, translation: w.translation_es ?? "" }))
  return { kind: "practice", modeId, words: planWords, minutes: MINUTES.practice }
}

const playedGames = (completed: PlanStep[]) => completed.flatMap((s) => (s.kind === "practice" ? [s.modeId] : []))

function practiceStep(words: WordToPractice[], isAvailable: (modeId: string) => boolean, played: string[]): PlanStep | null {
  const modeId = suggestedGame(words, isAvailable, played)
  return modeId ? practiceDone(modeId, words) : null
}

/**
 * Today's work, in order: clips feed the word games, ideas come next, then one game for the weakest words.
 * Finished steps come first, checked. The list is finite: one game a day is enough to tick practice off.
 */
export function buildStudyPlan({ clips, concepts, words, isAvailable, completed }: PlanInput): PlanEntry[] {
  const finished = new Set(completed.map(stepKey))
  const played = playedGames(completed)
  const todo: PlanStep[] = []
  if (clips.length > 0) todo.push({ kind: "clips", count: clips.length, minutes: clips.length * MINUTES.clip })
  for (const gap of concepts.filter((g) => !finished.has(`concept:${g.id}`)).slice(0, MAX_CONCEPTS)) {
    todo.push(conceptStep(gap))
  }
  const practice = played.length === 0 ? practiceStep(words, isAvailable, played) : null
  if (practice) todo.push(practice)
  const pending = new Set(todo.map(stepKey))
  const done = completed.filter((step) => !pending.has(stepKey(step)))
  return [...done.map((step) => ({ ...step, done: true })), ...todo.map((step) => ({ ...step, done: false }))]
}

/** Time left: finished steps do not count. */
export const planMinutes = (steps: PlanEntry[]) => steps.filter((s) => !s.done).reduce((total, step) => total + step.minutes, 0)

/** Games finished today (for the "Done today" check and the next suggestion). */
export const gamesPlayed = playedGames
