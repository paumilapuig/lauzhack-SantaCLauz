// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { MyWord } from "./types"
import { MyWordsList } from "./my-words-list"

const base = { definition_fr: "d", key_phrase: "k", level: 0, clip_id: null }
const words: MyWord[] = [
  { ...base, lemma: "déchet", translation_es: "desecho" },
  { ...base, lemma: "cellule", translation_es: "célula" },
]

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("MyWordsList", () => {
  it("offers Quitar for every word", () => {
    render(<MyWordsList words={words} onRemove={vi.fn()} />)
    expect(screen.getByLabelText("Quitar déchet")).toBeTruthy()
    expect(screen.getByLabelText("Quitar cellule")).toBeTruthy()
  })

  it("calls onRemove with the lemma after 5 s", () => {
    vi.useFakeTimers()
    const onRemove = vi.fn()
    render(<MyWordsList words={words} onRemove={onRemove} />)
    fireEvent.click(screen.getByLabelText("Quitar cellule"))
    expect(screen.getByText("Quitada")).toBeTruthy()
    act(() => void vi.advanceTimersByTime(4999))
    expect(onRemove).not.toHaveBeenCalled()
    act(() => void vi.advanceTimersByTime(1))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledWith("cellule")
  })

  it("Deshacer keeps the word and never calls onRemove", () => {
    vi.useFakeTimers()
    const onRemove = vi.fn()
    render(<MyWordsList words={words} onRemove={onRemove} />)
    fireEvent.click(screen.getByLabelText("Quitar cellule"))
    fireEvent.click(screen.getByText("Deshacer"))
    act(() => void vi.advanceTimersByTime(10000))
    expect(onRemove).not.toHaveBeenCalled()
    expect(screen.getByLabelText("Quitar cellule")).toBeTruthy()
  })

  it("shows the empty state", () => {
    render(<MyWordsList words={[]} onRemove={vi.fn()} />)
    expect(screen.getByText(/Aún no tienes palabras/)).toBeTruthy()
  })

  it("compact variant uses h-9 rows and keeps Quitar", () => {
    const { container } = render(<MyWordsList words={words} onRemove={vi.fn()} variant="compact" />)
    expect(container.querySelector("li")?.className).toContain("h-9")
    expect(screen.getByLabelText("Quitar déchet")).toBeTruthy()
  })
})
