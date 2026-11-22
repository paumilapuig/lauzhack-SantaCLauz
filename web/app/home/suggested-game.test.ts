import { describe, expect, it } from "vitest"
import type { WordToPractice } from "@/lib/student-contract"
import { focusWords, suggestedGame } from "./suggested-game"

const word = (w: string, level: number | null): WordToPractice => ({
  word: w, lemma: level === null ? null : w, translation_es: `${w}-es`, definition_fr: null, key_phrase: "", level, clip_id: "c1",
})
const every = () => true

describe("focusWords", () => {
  it("puts the weakest words first, once per lemma, at most 3", () => {
    const words = [word("chaleur", 1), word("déchet", 0), word("déchet", 0), word("sang", null), word("eau", 1)]
    expect(focusWords(words).map((w) => w.word)).toEqual(["déchet", "sang", "chaleur"])
  })
})

describe("suggestedGame", () => {
  it("new words start with flashcards; words already seen go to step by step", () => {
    expect(suggestedGame([word("déchet", 0)], every, [])).toBe("flashcards")
    expect(suggestedGame([word("chaleur", 1)], every, [])).toBe("step-by-step")
  })

  it("skips games played today and games that are not available", () => {
    expect(suggestedGame([word("déchet", 0)], every, ["flashcards"])).toBe("match-pairs")
    expect(suggestedGame([word("déchet", 0)], (id) => id === "dictation", [])).toBe("dictation")
  })

  it("suggests nothing without words", () => {
    expect(suggestedGame([], every, [])).toBeNull()
  })
})
