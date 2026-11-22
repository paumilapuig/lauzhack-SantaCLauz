// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ConceptStep } from "@/lib/student-contract"
import { ConceptStoryboard } from "./storyboard"

const STEPS: ConceptStep[] = [
  { fr: "La nourriture entre dans la cellule.", es: "…", visual: "🍎➡️🧫" },
  { fr: "Elle devient du glucose.", es: "…", visual: "🍎➡️🍬" },
  { fr: "La cellule libère de l'énergie.", es: "…", visual: "" },
]

afterEach(cleanup)

describe("ConceptStoryboard (concepts without boxes)", () => {
  it("draws one card per step with its emoji line, and marks the current step", () => {
    render(<ConceptStoryboard steps={STEPS} current={1} saved={new Set()} onTap={() => {}} onSelectStep={() => {}} />)
    const cards = screen.getAllByRole("listitem")
    expect(cards).toHaveLength(3)
    expect(cards[0].textContent).toContain("🍎➡️🧫")
    expect(cards[1].getAttribute("aria-current")).toBe("step")
    expect(cards[2].textContent).toContain("La cellule libère de l'énergie.")
  })

  it("a tap on a later step opens it; words of explained steps can be tapped", () => {
    const onSelectStep = vi.fn()
    const onTap = vi.fn()
    render(<ConceptStoryboard steps={STEPS} current={1} saved={new Set()} onTap={onTap} onSelectStep={onSelectStep} />)
    fireEvent.click(screen.getByText("La cellule libère de l'énergie."))
    expect(onSelectStep).toHaveBeenCalledWith(2)
    fireEvent.click(screen.getByRole("button", { name: "glucose" }))
    expect(onTap).toHaveBeenCalledWith("glucose", "Elle devient du glucose.")
  })
})
