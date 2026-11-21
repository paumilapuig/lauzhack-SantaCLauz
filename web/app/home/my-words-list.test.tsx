// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { MyWord } from "./types"
import { MyWordsList } from "./my-words-list"

const base = { definition_fr: "d", key_phrase: "k", level: 0, clip_id: null }
const words: MyWord[] = [
  { ...base, lemma: "déchet", translation_es: "desecho", source: "class" },
  { ...base, lemma: "cellule", translation_es: "célula", source: "home" },
]

afterEach(cleanup)

describe("MyWordsList", () => {
  it("shows the source tag per word", () => {
    render(<MyWordsList words={words} onRemove={vi.fn()} />)
    expect(screen.getByText("De clase")).toBeTruthy()
    expect(screen.getByText("Marcada en casa")).toBeTruthy()
  })

  it("offers Quitar only for home words", () => {
    render(<MyWordsList words={words} onRemove={vi.fn()} />)
    expect(screen.queryByLabelText("Quitar déchet")).toBeNull()
    expect(screen.getByLabelText("Quitar cellule")).toBeTruthy()
  })

  it("calls onRemove with the lemma", () => {
    const onRemove = vi.fn()
    render(<MyWordsList words={words} onRemove={onRemove} />)
    fireEvent.click(screen.getByLabelText("Quitar cellule"))
    expect(onRemove).toHaveBeenCalledWith("cellule")
  })

  it("shows the empty state", () => {
    render(<MyWordsList words={[]} onRemove={vi.fn()} />)
    expect(screen.getByText(/Aún no tienes palabras/)).toBeTruthy()
  })
})
