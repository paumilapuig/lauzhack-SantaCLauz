import { describe, expect, it } from "vitest"
import { barHeights } from "./waveform"

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
