// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { MAX_IN_TANK } from "./aquarium-layout"
import { WordAquarium } from "./word-aquarium"

afterEach(cleanup)

const words = [
  { lemma: "déchet", translation_es: "desecho", level: 0 },
  { lemma: "muscle", translation_es: "músculo", level: 1 },
  { lemma: "cellule", translation_es: "célula", level: 2 },
  { lemma: "glucose", translation_es: null, level: 3 },
]

describe("WordAquarium", () => {
  it("every word is an animal that shows how grown it is", () => {
    render(<WordAquarium words={words} />)
    const tank = screen.getByRole("list", { name: "Your aquarium" })
    expect(within(tank).getAllByRole("listitem").map((li) => li.getAttribute("aria-label")).sort()).toEqual([
      "cellule, célula: grown",
      "déchet, desecho: an egg",
      "glucose: fully grown",
      "muscle, músculo: a baby",
    ])
  })

  it("keeps the tank uncluttered and lists the other words on demand", () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ lemma: `mot${i}`, translation_es: null, level: i % 4 }))
    render(<WordAquarium words={many} />)
    expect(within(screen.getByRole("list", { name: "Your aquarium" })).getAllByRole("listitem")).toHaveLength(MAX_IN_TANK)
    expect(screen.queryByRole("list", { name: "Other words" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Show all your words" }))
    expect(within(screen.getByRole("list", { name: "Other words" })).getAllByRole("listitem")).toHaveLength(25 - MAX_IN_TANK)
  })

  it("never shows a percentage, a count out of a total, or emoji", () => {
    render(<WordAquarium words={words} />)
    const visible = document.body.cloneNode(true) as HTMLElement
    visible.querySelectorAll("style").forEach((el) => el.remove())
    expect(visible.textContent).not.toMatch(/%|\d+\s*\/\s*\d+|\bof\s+\d+/)
    expect(visible.textContent).not.toMatch(/\p{Extended_Pictographic}/u)
  })

  it("an empty aquarium invites her to mark her first word", () => {
    render(<WordAquarium words={[]} />)
    expect(screen.getByText(/it becomes your first egg/)).toBeTruthy()
  })
})
