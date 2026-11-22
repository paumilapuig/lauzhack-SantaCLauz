import { describe, expect, it } from "vitest"
import type { ConceptStep } from "@/lib/student-contract"
import { layoutDiagram, stepOfNode } from "./diagram-layout"

const step = (nodes: ConceptStep["nodes"] = [], links: ConceptStep["links"] = []): ConceptStep => ({
  fr: "x", es: "x", visual: "", nodes, links, words: [],
})
const node = (id: string, kind: "input" | "process" | "output" | "place" = "process", inside: string | null = null) => ({
  id, fr: id, kind, inside,
})

describe("layoutDiagram", () => {
  it("puts a node after the nodes that point to it", () => {
    const layout = layoutDiagram([
      step([node("glucose", "input"), node("oxygene", "input")]),
      step([node("respiration")], [{ from: "glucose", to: "respiration", fr: null }, { from: "oxygene", to: "respiration", fr: null }]),
      step([node("energie", "output")], [{ from: "respiration", to: "energie", fr: "libère" }]),
    ])
    const column = (id: string) => layout.boxes.find((b) => b.id === id)!.column
    expect([column("glucose"), column("oxygene"), column("respiration"), column("energie")]).toEqual([0, 0, 1, 2])
    expect(layout.edges.map((e) => e.label)).toEqual([null, null, "libère"])
  })

  it("keeps boxes of a place in the place's column, inside its zone", () => {
    const layout = layoutDiagram([
      step([node("cellule", "place"), node("glucose", "input")]),
      step([node("respiration", "process", "cellule")], [{ from: "glucose", to: "respiration", fr: null }]),
    ])
    const zone = layout.boxes.find((b) => b.id === "cellule")!
    const inner = layout.boxes.find((b) => b.id === "respiration")!
    expect(zone.zone).toBe(true)
    expect(inner.column).toBe(zone.column)
    expect(inner.y).toBeGreaterThan(zone.y)
    expect(inner.y + inner.h).toBeLessThanOrEqual(zone.y + zone.h)
  })

  it("ignores links to unknown nodes and survives cycles", () => {
    const layout = layoutDiagram([
      step([node("a"), node("b")], [{ from: "a", to: "b", fr: null }, { from: "b", to: "a", fr: null }, { from: "a", to: "zzz", fr: null }]),
    ])
    expect(layout.boxes).toHaveLength(2)
    expect(layout.edges).toHaveLength(2)
    expect(layout.width).toBeGreaterThan(0)
  })

  it("is empty for steps without a diagram", () => {
    const layout = layoutDiagram([{ fr: "a", es: "b", visual: "🫁" } as ConceptStep])
    expect(layout.boxes).toEqual([])
  })

  it("knows in which step each box and arrow appears", () => {
    const steps = [step([node("a")]), step([node("b")], [{ from: "a", to: "b", fr: null }])]
    const layout = layoutDiagram(steps)
    expect(stepOfNode(steps).get("b")).toBe(1)
    expect(layout.edges[0].step).toBe(1)
  })
})

describe("arrow labels", () => {
  it("never sit on top of each other", () => {
    const layout = layoutDiagram([
      step([node("cell", "place"), node("food", "input"), node("energy", "output")], [{ from: "cell", to: "energy", fr: "produit" }]),
      step([node("resp", "process", "cell")], [{ from: "resp", to: "energy", fr: "crée" }]),
    ])
    const [a, b] = layout.edges
    expect(Math.abs(a.labelY - b.labelY) >= 26 || Math.abs(a.labelX - b.labelX) >= 120).toBe(true)
  })
})
