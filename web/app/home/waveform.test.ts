import { describe, expect, it } from "vitest"
import { barHeights, thinMarks } from "./waveform"

describe("barHeights", () => {
  it("is deterministic per seed and stays within 0.15–1", () => {
    const a = barHeights("c1… elle produit")
    expect(a).toEqual(barHeights("c1… elle produit"))
    expect(a).toHaveLength(64)
    expect(a.every((h) => h >= 0.15 && h <= 1)).toBe(true)
  })

  it("gives different clips different shapes", () => {
    expect(barHeights("c1")).not.toEqual(barHeights("c2"))
  })
})

describe("thinMarks", () => {
  const marks = [
    { at: 0.1, label: "a" },
    { at: 0.15, label: "b" },
    { at: 0.5, label: "c" },
  ]

  it("skips a label closer than 64px to the previous kept one", () => {
    expect(thinMarks(marks, 400).map((m) => m.label)).toEqual(["a", "c"])
  })

  it("keeps all when width is unknown", () => {
    expect(thinMarks(marks, 0)).toHaveLength(3)
  })

  it("sorts by position", () => {
    expect(thinMarks([marks[2], marks[0]], 400).map((m) => m.label)).toEqual(["a", "c"])
  })
})
