import { describe, expect, it } from "vitest"
import { glossFor, splitWords } from "./words"

describe("splitWords", () => {
  it("keeps punctuation and spaces as plain text and makes words tappable", () => {
    expect(splitWords("La cellule libère, vite.")).toEqual([
      { text: "La", word: "la" }, { text: " " }, { text: "cellule", word: "cellule" }, { text: " " },
      { text: "libère", word: "libère" }, { text: ", " }, { text: "vite", word: "vite" }, { text: "." },
    ])
  })

  it("splits elisions so the noun is tappable on its own", () => {
    expect(splitWords("l'énergie d’abord").filter((p) => p.word).map((p) => p.word)).toEqual(["l'", "énergie", "d'", "abord"])
  })
})

describe("glossFor", () => {
  const words = [{ fr: "libère", es: "libera" }, { fr: "dioxyde de carbone", es: "dióxido de carbono" }, { fr: "Énergie", es: "energía" }]

  it("finds the Spanish of a tapped word, ignoring case", () => {
    expect(glossFor("énergie", words)).toBe("energía")
    expect(glossFor("libère", words)).toBe("libera")
  })

  it("finds a word that is part of a multi-word entry", () => {
    expect(glossFor("dioxyde", words)).toBe("dióxido de carbono")
  })

  it("returns null when unknown", () => {
    expect(glossFor("cellule", words)).toBeNull()
  })
})
