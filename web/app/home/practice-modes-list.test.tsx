// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Layers, Link2 } from "lucide-react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PracticeModesList } from "./practice-modes-list"

afterEach(cleanup)

const modes = [
  { id: "flashcards", name: "Tarjetas", description: "Repasa cada palabra", icon: Layers, minWords: 1 },
  { id: "match-pairs", name: "Parejas", description: "Une palabra y significado", icon: Link2, minWords: 2 },
]

describe("PracticeModesList", () => {
  it("tap calls onOpen(id)", () => {
    const onOpen = vi.fn()
    render(<PracticeModesList modes={modes} wordCount={1} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole("button", { name: /Tarjetas/ }))
    expect(onOpen).toHaveBeenCalledWith("flashcards")
  })

  it("Parejas is disabled with 1 word and does not open", () => {
    const onOpen = vi.fn()
    render(<PracticeModesList modes={modes} wordCount={1} onOpen={onOpen} />)
    const row = screen.getByRole("button", { name: /Parejas/ })
    expect(row.getAttribute("aria-disabled")).toBe("true")
    expect(row.textContent).toContain("al menos 2 palabras")
    fireEvent.click(row)
    expect(onOpen).not.toHaveBeenCalled()
  })
})
