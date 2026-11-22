// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Word } from "./word"

const setup = (state: "green" | "yellow" | "orange", onTap = vi.fn()) => {
  render(<Word text="déchet" translation="desecho" state={state} onTap={onTap} />)
  return { button: screen.getByRole("button"), onTap }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("Word", () => {
  it("has lang fr and data-state", () => {
    const { button } = setup("yellow")
    expect(button.getAttribute("lang")).toBe("fr")
    expect(button.getAttribute("data-state")).toBe("yellow")
  })

  it("yellow shows translation linked by aria-describedby", () => {
    const { button } = setup("yellow")
    const gloss = screen.getByText("desecho")
    expect(gloss.getAttribute("lang")).toBe("es")
    expect(button.getAttribute("aria-describedby")).toBe(gloss.id)
  })

  it("green hides translation until clicked", () => {
    const { button } = setup("green")
    expect(screen.queryByText("desecho")).toBeNull()
    expect(button.getAttribute("aria-describedby")).toBeNull()
    fireEvent.click(button)
    expect(screen.getByText("desecho")).toBeTruthy()
  })

  it("orange has sr-only text and aria-hidden icon", () => {
    const { button } = setup("orange")
    expect(screen.getByText("you tapped it before").className).toContain("sr-only")
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true")
  })

  it("click calls onTap once and data-tapped clears after 600 ms", () => {
    const { button, onTap } = setup("yellow")
    fireEvent.click(button)
    expect(onTap).toHaveBeenCalledTimes(1)
    expect(button.hasAttribute("data-tapped")).toBe(true)
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(button.hasAttribute("data-tapped")).toBe(false)
  })
})
