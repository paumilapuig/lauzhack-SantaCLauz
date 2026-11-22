// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { WordGarden } from "./word-garden"

afterEach(cleanup)

const words = [
  { lemma: "déchet", translation_es: "desecho", level: 0 },
  { lemma: "muscle", translation_es: "músculo", level: 1 },
  { lemma: "cellule", translation_es: "célula", level: 2 },
  { lemma: "glucose", translation_es: null, level: 3 },
]

describe("WordGarden", () => {
  it("every word is a plant: the ones she no longer needs help with bloom apart from the ones still growing", () => {
    render(<WordGarden words={words} />)
    const blooming = screen.getByRole("list", { name: "No help needed" })
    const growing = screen.getByRole("list", { name: "Still growing" })
    expect(within(blooming).getAllByRole("listitem").map((li) => li.getAttribute("aria-label"))).toEqual([
      "glucose: in flower",
      "cellule, célula: in leaf",
    ])
    expect(within(growing).getAllByRole("listitem").map((li) => li.getAttribute("aria-label"))).toEqual([
      "muscle, músculo: a sprout",
      "déchet, desecho: a seed",
    ])
  })

  it("never shows a percentage or a count out of a total", () => {
    render(<WordGarden words={words} />)
    expect(document.body.textContent).not.toMatch(/%|\d+\s*\/\s*\d+|\bof\s+\d+/)
  })

  it("an empty garden invites her to plant the first word", () => {
    render(<WordGarden words={[]} />)
    expect(screen.getByText(/Mark a word you don.t understand/)).toBeTruthy()
  })
})
