import { describe, expect, it } from "vitest"
import type { MyWord } from "./types"
import { usableWords } from "./usable-words"

const word = (over: Partial<MyWord>): MyWord => ({
  lemma: "a", translation_es: "x", definition_fr: "y", key_phrase: "z", level: 0, clip_id: null, source: "home", ...over,
})

describe("usableWords", () => {
  const words = [word({ lemma: "full" }), word({ lemma: "bare", translation_es: "", definition_fr: "" }), word({ lemma: "nophrase", key_phrase: " " })]

  it("keeps everything when nothing is needed", () => {
    expect(usableWords(words, [])).toHaveLength(3)
  })

  it("drops words missing a needed field", () => {
    expect(usableWords(words, ["translation"]).map((w) => w.lemma)).toEqual(["full", "nophrase"])
    expect(usableWords(words, ["definition", "phrase"]).map((w) => w.lemma)).toEqual(["full"])
  })
})
