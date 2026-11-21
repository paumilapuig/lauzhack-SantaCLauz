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

describe("timeline", () => {
  it("gives every word a start time that grows, with longer gaps after punctuation", async () => {
    const { timeline } = await import("./karaoke")
    const { words, total } = timeline("Il court. Elle marche lentement", 1)
    expect(words.map((w) => w.start)).toEqual([0, 3, 10, 15, 22])
    const gaps = words.slice(1).map((w, i) => w.at - words[i].at)
    expect(gaps.every((g) => g > 0)).toBe(true)
    expect(gaps[1]).toBeGreaterThan(gaps[0]) // "court." is followed by a sentence pause
    expect(total).toBeGreaterThan(words[4].at)
  })

  it("is slower at a lower rate", async () => {
    const { timeline } = await import("./karaoke")
    expect(timeline("bonjour madame", 0.5).total).toBeCloseTo(timeline("bonjour madame", 1).total * 2)
  })
})
