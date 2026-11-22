import { describe, expect, it } from "vitest"
import type { ConceptGap, HomeClip, WordToPractice } from "@/lib/student-contract"
import { buildStudyPlan, focusWords, planMinutes, stepKey, type PlanStep } from "./study-plan"

const clip = (id: string) => ({ id }) as HomeClip
const gap = (id: string, concept: string) => ({ id, concept, exercises: [{}, {}] }) as unknown as ConceptGap
const word = (w: string, level: number | null, translation: string | null = `${w}-es`): WordToPractice => ({
  word: w, lemma: level === null ? null : w, translation_es: translation, definition_fr: null, key_phrase: "", level, clip_id: "c1",
})
const everyMode = () => true
const none: PlanStep[] = []

describe("focusWords", () => {
  it("puts the weakest words first, once per lemma, at most 3", () => {
    const words = [word("chaleur", 1), word("déchet", 0), word("déchet", 0), word("sang", null), word("eau", 1)]
    expect(focusWords(words).map((w) => w.word)).toEqual(["déchet", "sang", "chaleur"])
  })
})

describe("buildStudyPlan", () => {
  it("orders clips, then concepts, then practice", () => {
    const plan = buildStudyPlan({ clips: [clip("a"), clip("b")], concepts: [gap("g1", "La respiration")], words: [word("déchet", 0)], isAvailable: everyMode, completed: none })
    expect(plan.map((s) => s.kind)).toEqual(["clips", "concept", "practice"])
    expect(plan[0]).toMatchObject({ kind: "clips", count: 2 })
    expect(plan[1]).toMatchObject({ kind: "concept", id: "g1", concept: "La respiration", questions: 2 })
  })

  it("new words start with flashcards; words already seen go to step by step", () => {
    const fresh = buildStudyPlan({ clips: [], concepts: [], words: [word("déchet", 0)], isAvailable: everyMode, completed: none })
    expect(fresh[0]).toMatchObject({ kind: "practice", modeId: "flashcards", words: [{ lemma: "déchet", translation: "déchet-es" }] })
    const seen = buildStudyPlan({ clips: [], concepts: [], words: [word("chaleur", 1)], isAvailable: everyMode, completed: none })
    expect(seen[0]).toMatchObject({ kind: "practice", modeId: "step-by-step" })
  })

  it("skips modes that are not available and keeps at most 2 concepts", () => {
    const plan = buildStudyPlan({
      clips: [],
      concepts: [gap("1", "a"), gap("2", "b"), gap("3", "c")],
      words: [word("déchet", 0)],
      isAvailable: (id) => id === "dictation",
      completed: none,
    })
    expect(plan.filter((s) => s.kind === "concept")).toHaveLength(2)
    expect(plan.at(-1)).toMatchObject({ kind: "practice", modeId: "dictation" })
  })

  it("is empty when there is nothing to do", () => {
    expect(buildStudyPlan({ clips: [], concepts: [], words: [], isAvailable: everyMode, completed: none })).toEqual([])
  })

  it("adds up a short time estimate", () => {
    const plan = buildStudyPlan({ clips: [clip("a")], concepts: [gap("g", "x")], words: [word("déchet", 0)], isAvailable: everyMode, completed: none })
    expect(planMinutes(plan)).toBe(6)
  })

  it("a finished game stays in the plan as done, and the next game is suggested", () => {
    const words = [word("déchet", 0)]
    const first = buildStudyPlan({ clips: [], concepts: [], words, isAvailable: everyMode, completed: none })
    const plan = buildStudyPlan({ clips: [], concepts: [], words, isAvailable: everyMode, completed: [first[0]] })
    expect(plan.map((s) => [s.kind, s.kind === "practice" ? s.modeId : "", s.done])).toEqual([
      ["practice", "flashcards", true],
      ["practice", "match-pairs", false],
    ])
    expect(planMinutes(plan)).toBe(2)
  })

  it("a done concept or clips step is not offered again", () => {
    const concept = { kind: "concept", id: "g1", concept: "x", questions: 2, minutes: 3 } as const
    const clips = { kind: "clips", count: 2, minutes: 2 } as const
    const plan = buildStudyPlan({ clips: [], concepts: [gap("g1", "x")], words: [], isAvailable: everyMode, completed: [clips, concept] })
    expect(plan.map((s) => [stepKey(s), s.done])).toEqual([["clips", true], ["concept:g1", true]])
  })
})
