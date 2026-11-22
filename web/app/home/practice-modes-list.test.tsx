// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Layers, Link2 } from "lucide-react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PracticeModesList } from "./practice-modes-list"

afterEach(cleanup)

const modes = [
  { id: "flashcards", name: "Flashcards", description: "Voltea y recuerda", icon: Layers, minWords: 1, needs: [] },
  { id: "match-pairs", name: "Pairs", description: "Une cada par", icon: Link2, minWords: 2, needs: [] },
]

describe("PracticeModesList", () => {
  it("tap calls onOpen(id)", () => {
    const onOpen = vi.fn()
    render(<PracticeModesList modes={modes} wordCount={1} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole("button", { name: /Flashcards/ }))
    expect(onOpen).toHaveBeenCalledWith("flashcards")
  })

  it("Pairs is disabled with 1 word and does not open", () => {
    const onOpen = vi.fn()
    render(<PracticeModesList modes={modes} wordCount={1} onOpen={onOpen} />)
    const row = screen.getByRole("button", { name: /Pairs/ })
    expect(row.getAttribute("aria-disabled")).toBe("true")
    expect(row.title).toContain("at least 2 words")
    expect(row.textContent).toContain("at least 2 words")
    fireEvent.click(row)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it("shows the description, or the reason when disabled", () => {
    render(<PracticeModesList modes={modes} wordCount={1} onOpen={vi.fn()} />)
    expect(screen.getByText("Voltea y recuerda")).toBeTruthy()
    expect(screen.queryByText("Une cada par")).toBeNull()
  })
})
