import { describe, expect, it } from "vitest"
import { audioSeconds, clock } from "./clip-clock"

describe("clock", () => {
  it("shows minutes and seconds", () => {
    expect(clock(0)).toBe("0:00")
    expect(clock(13_400)).toBe("0:13")
    expect(clock(75_000)).toBe("1:15")
  })

  it("never shows NaN, even without a known length (bug Sun 22 Nov: every clip time read NaN:NaN)", () => {
    expect(clock(Infinity)).toBe("0:00")
    expect(clock(NaN)).toBe("0:00")
  })
})

describe("audioSeconds", () => {
  it("trusts the browser when it knows the length", () => {
    expect(audioSeconds(12.5, 13)).toBe(12.5)
  })

  it("uses the clip's own length for recordings without one (Chrome's webm reports Infinity)", () => {
    expect(audioSeconds(Infinity, 13)).toBe(13)
    expect(audioSeconds(NaN, 13)).toBe(13)
    expect(audioSeconds(0, 13)).toBe(13)
  })
})
