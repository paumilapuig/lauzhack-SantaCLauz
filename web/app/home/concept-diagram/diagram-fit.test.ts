import { describe, expect, it } from "vitest"
import { fitScale, hasBoxDiagram } from "./diagram-fit"
import type { ConceptStep } from "@/lib/student-contract"

const withNodes: ConceptStep = { fr: "La cellule respire.", es: "La célula respira.", nodes: [{ id: "a", fr: "Cellule", kind: "input", inside: null }], links: [] }
const oldStep: ConceptStep = { fr: "La nourriture devient du glucose.", es: "…", visual: "🍎➡️🍬" }

describe("hasBoxDiagram", () => {
  it("is true only when every step brings boxes or arrows", () => {
    expect(hasBoxDiagram([withNodes, withNodes])).toBe(true)
    expect(hasBoxDiagram([oldStep, oldStep])).toBe(false)
    expect(hasBoxDiagram([withNodes, oldStep])).toBe(false)
    expect(hasBoxDiagram([])).toBe(false)
  })
})

describe("fitScale", () => {
  it("shrinks a wide diagram to its container, never grows it, and stops at a readable minimum", () => {
    expect(fitScale(800, 1000)).toBe(0.8)
    expect(fitScale(1200, 1000)).toBe(1)
    expect(fitScale(300, 1000)).toBe(0.6)
    expect(fitScale(0, 1000)).toBe(1)
  })
})
