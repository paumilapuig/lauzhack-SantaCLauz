// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Layers } from "lucide-react"
import type { PlanEntry } from "./study-plan"
import { StudyPlan } from "./study-plan-view"

afterEach(cleanup)

const noop = () => {}
const MODES = [{ id: "flashcards", name: "Flashcards", description: "", icon: Layers, minWords: 1, needs: [] }]
const plan = (doneGame: boolean): PlanEntry[] => [
  { kind: "clips", count: 1, minutes: 1, done: true },
  { kind: "practice", modeId: "flashcards", words: [], minutes: 2, done: doneGame },
]
const show = (steps: PlanEntry[]) =>
  render(<StudyPlan steps={steps} modes={MODES} onClips={noop} onConcept={noop} onPractice={noop} />)

describe("StudyPlan", () => {
  it("while steps are left it shows what comes next and how long it takes", () => {
    show(plan(false))
    expect(screen.getByRole("heading", { name: "Your next 1 step" })).toBeTruthy()
    expect(screen.queryByText("Well done!")).toBeNull()
  })

  it("when every step of the day is finished it says Well done", () => {
    show(plan(true))
    expect(screen.getByRole("status").textContent).toContain("Well done!")
    expect(screen.getByText(/You finished 2 steps today/)).toBeTruthy()
    expect(screen.getAllByText("Done")).toHaveLength(2)
  })
})
