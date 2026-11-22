import { describe, expect, it } from "vitest"
import type { ConceptGap, HomeClip, WordToPractice } from "@/lib/student-contract"
import { buildStudyPlan, focusWords, planMinutes } from "./study-plan"

const clip = (id: string) => ({ id }) as HomeClip
const gap = (id: string, concept: string) => ({ id, concept, exercises: [{}, {}] }) as unknown as ConceptGap
const word = (w: string, level: number | null, translation: string | null = `${w}-es`): WordToPractice => ({
  word: w, lemma: level === null ? null : w, translation_es: translation, definition_fr: null, key_phrase: "", level, clip_id: "c1",
})
const everyMode = () => true

describe("focusWords", () => {
  it("puts the weakest words first, once per lemma, at most 3", () => {
    const words = [word("chaleur", 1), word("déchet", 0), word("déchet", 0), word("sang", null), word("eau", 1)]
    expect(focusWords(words).map((w) => w.word)).toEqual(["déchet", "sang", "chaleur"])
  })
})

describe("buildStudyPlan", () => {
  it("orders clips, then concepts, then practice", () => {
    const plan = buildStudyPlan({ clips: [clip("a"), clip("b")], concepts: [gap("g1", "La respiration")], words: [word("déchet", 0)], isAvailable: everyMode })
    expect(plan.map((s) => s.kind)).toEqual(["clips", "concept", "practice"])
    expect(plan[0]).toMatchObject({ kind: "clips", count: 2 })
    expect(plan[1]).toMatchObject({ kind: "concept", id: "g1", concept: "La respiration", questions: 2 })
  })

  it("new words start with flashcards; words already seen go to step by step", () => {
    const fresh = buildStudyPlan({ clips: [], concepts: [], words: [word("déchet", 0)], isAvailable: everyMode })
    expect(fresh[0]).toMatchObject({ kind: "practice", modeId: "flashcards", words: [{ lemma: "déchet", translation: "déchet-es" }] })
    const seen = buildStudyPlan({ clips: [], concepts: [], words: [word("chaleur", 1)], isAvailable: everyMode })
    expect(seen[0]).toMatchObject({ kind: "practice", modeId: "step-by-step" })
  })

  it("skips modes that are not available and keeps at most 2 concepts", () => {
    const plan = buildStudyPlan({
      clips: [],
      concepts: [gap("1", "a"), gap("2", "b"), gap("3", "c")],
      words: [word("déchet", 0)],
      isAvailable: (id) => id === "dictation",
    })
    expect(plan.filter((s) => s.kind === "concept")).toHaveLength(2)
    expect(plan.at(-1)).toMatchObject({ kind: "practice", modeId: "dictation" })
  })

  it("is empty when there is nothing to do", () => {
    expect(buildStudyPlan({ clips: [], concepts: [], words: [], isAvailable: everyMode })).toEqual([])
  })

  it("adds up a short time estimate", () => {
    const plan = buildStudyPlan({ clips: [clip("a")], concepts: [gap("g", "x")], words: [word("déchet", 0)], isAvailable: everyMode })
    expect(planMinutes(plan)).toBe(6)
  })
})
