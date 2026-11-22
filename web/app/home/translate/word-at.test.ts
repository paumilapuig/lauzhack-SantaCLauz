import { describe, expect, it } from "vitest"
import { wordAt } from "./word-at"

describe("wordAt", () => {
  const text = "La cellule utilise l'énergie."

  it("finds the word around a position, wherever the click lands in it", () => {
    expect(wordAt(text, 3)).toEqual({ start: 3, end: 10 })
    expect(wordAt(text, 7)).toEqual({ start: 3, end: 10 })
    expect(text.slice(3, 10)).toBe("cellule")
  })

  it("a click right after the last letter still takes the word", () => {
    expect(wordAt(text, 10)).toEqual({ start: 3, end: 10 })
  })

  it("splits l'énergie like the rest of Loop'd: the article and the word", () => {
    const at = wordAt(text, 23)!
    expect(text.slice(at.start, at.end)).toBe("énergie")
  })

  it("no word on spaces or punctuation far from letters", () => {
    expect(wordAt("a  —  b", 3)).toBeNull()
  })
})
