// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { WeekStrip } from "./week-strip"

afterEach(cleanup)

const week = ["16", "17", "18", "19", "20", "21", "22"].map((d, i) => ({ date: `2026-11-${d}`, practised: i === 0 || i === 3 }))

describe("WeekStrip", () => {
  it("shows Monday to Sunday and checks the days she practised", () => {
    render(<WeekStrip week={week} today="2026-11-19" />)
    const days = screen.getAllByRole("listitem")
    expect(days.map((d) => d.getAttribute("aria-label"))).toEqual([
      "Monday: practised",
      "Tuesday",
      "Wednesday",
      "Thursday, today: practised",
      "Friday",
      "Saturday",
      "Sunday",
    ])
  })

  it("names the streak in words when she practised days in a row, never as a fraction", () => {
    render(<WeekStrip week={week.map((d, i) => ({ ...d, practised: i >= 1 && i <= 3 }))} today="2026-11-19" />)
    expect(screen.getByText("3 days in a row")).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/\d+\s*\/\s*7/)
  })
})
