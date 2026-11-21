import { describe, expect, it } from "vitest"
import { shuffle } from "./shuffle"

describe("shuffle", () => {
  const items = [1, 2, 3, 4, 5, 6]

  it("same seed gives same order", () => {
    expect(shuffle(items, 7)).toEqual(shuffle(items, 7))
  })

  it("keeps the items and does not mutate the input", () => {
    expect([...shuffle(items, 3)].sort()).toEqual(items)
    expect(items).toEqual([1, 2, 3, 4, 5, 6])
  })

  it("never returns the input order when length > 1", () => {
    for (let seed = 0; seed < 200; seed++) {
      expect(shuffle([1, 2], seed)).toEqual([2, 1])
      expect(shuffle(items, seed)).not.toEqual(items)
    }
  })

  it("handles 0 and 1 items", () => {
    expect(shuffle([], 1)).toEqual([])
    expect(shuffle(["a"], 1)).toEqual(["a"])
  })
})
