import { describe, expect, it } from "vitest"
import { activeWordStart, wordStartAt } from "./karaoke"

const TEXT = "Elle produit aussi des déchets."

describe("activeWordStart", () => {
  it("is null before playback starts", () => {
    expect(activeWordStart(TEXT, null)).toBeNull()
  })

  it("returns the start of the word under the playhead", () => {
    expect(activeWordStart(TEXT, 0)).toBe(0) // "Elle"
    expect(activeWordStart(TEXT, 7)).toBe(5) // inside "produit"
    expect(activeWordStart(TEXT, 12)).toBe(5) // the space after "produit" keeps "produit"
    expect(activeWordStart(TEXT, 25)).toBe(23) // "déchets"
  })
})

describe("wordStartAt", () => {
  it("snaps a ratio of the text to the start of that word", () => {
    expect(wordStartAt(TEXT, 0)).toBe(0)
    expect(wordStartAt(TEXT, 25 / TEXT.length)).toBe(23)
    expect(wordStartAt(TEXT, 1)).toBe(23)
  })
})
