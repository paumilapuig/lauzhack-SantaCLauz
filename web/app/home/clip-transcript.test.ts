import { describe, expect, it } from "vitest"
import { unbreakableChunks } from "./clip-transcript"

const slices = (text: string) => unbreakableChunks(text).map((c) => text.slice(c.start, c.end))

describe("unbreakableChunks", () => {
  it("keeps elisions and trailing punctuation with their word", () => {
    expect(slices("Les mitochondries utilisent l'oxygène pour le glucose. Cette")).toEqual([
      "Les", "mitochondries", "utilisent", "l'oxygène", "pour", "le", "glucose.", "Cette",
    ])
  })

  it("glues French stand-alone punctuation to the word before it", () => {
    expect(slices("des déchets : de l'eau")).toEqual(["des", "déchets :", "de", "l'eau"])
  })
})
