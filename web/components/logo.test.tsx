// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Logo } from "./logo"

afterEach(cleanup)

describe("Logo", () => {
  it("draws the two linked rings (orange then ink, ink on top) next to the name", () => {
    render(<Logo />)
    expect(screen.getByText("Loop'd")).toBeTruthy()
    const rings = document.querySelectorAll("svg circle")
    expect(Array.from(rings).map((c) => c.getAttribute("class"))).toEqual(["stroke-brand-orange", "stroke-heading"])
    expect(document.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true")
  })
})
