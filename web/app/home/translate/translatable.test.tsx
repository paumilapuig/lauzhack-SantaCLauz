// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { resetTranslator } from "./browser-translator"
import { Translatable } from "./translatable"

const g = globalThis as { Translator?: unknown }
const doc = document as unknown as { caretPositionFromPoint?: (x: number, y: number) => unknown }

beforeEach(() => {
  g.Translator = {
    availability: async () => "available",
    create: async () => ({ translate: async (text: string) => `ES(${text})` }),
  }
  // jsdom has no layout: every range sits at the top-left corner
  Range.prototype.getClientRects = () => [new DOMRect(0, 0, 10, 10)] as unknown as DOMRectList
})

afterEach(() => {
  cleanup()
  delete g.Translator
  delete doc.caretPositionFromPoint
  resetTranslator()
  vi.useRealTimers()
})

function page() {
  render(
    <Translatable known={(text) => (text === "cellule" ? "célula" : null)}>
      <p lang="fr">La cellule utilise l&apos;oxygène pour faire de l&apos;énergie.</p>
      <p lang="en">Tap any word you don&apos;t understand.</p>
      <button type="button" lang="fr">Explorer</button>
    </Translatable>,
  )
  return screen.getByText(/La cellule/).firstChild as Text
}

function clickAt(node: Node, offset: number) {
  doc.caretPositionFromPoint = () => ({ offsetNode: node, offset })
  fireEvent.click(node.parentElement!, { clientX: 1, clientY: 1 })
}

describe("Translatable", () => {
  it("a click on a French word shows its Spanish under it, from the glossary when Loop'd knows it", async () => {
    clickAt(page(), 5)
    expect(await screen.findByRole("button", { name: /cellule: célula/ })).toBeTruthy()
  })

  it("any other word is translated by the browser", async () => {
    clickAt(page(), 13)
    expect(await screen.findByRole("button", { name: "utilise: ES(utilise). Hide" })).toBeTruthy()
  })

  it("a selected sentence gets one translation for the whole sentence", async () => {
    const text = page()
    const range = document.createRange()
    range.setStart(text, 3)
    range.setEnd(text, 28)
    getSelection()!.removeAllRanges()
    getSelection()!.addRange(range)
    fireEvent.pointerUp(text.parentElement!)
    expect(await screen.findByRole("button", { name: "cellule utilise l'oxygène: ES(cellule utilise l'oxygène). Hide" })).toBeTruthy()
  })

  it("clicking the translation hides it; English text and buttons are left alone", async () => {
    clickAt(page(), 13)
    fireEvent.click(await screen.findByRole("button", { name: /utilise:/ }))
    expect(screen.queryByRole("button", { name: /utilise:/ })).toBeNull()
    clickAt(screen.getByText(/Tap any word/).firstChild!, 2)
    clickAt(screen.getByRole("button", { name: "Explorer" }).firstChild!, 2)
    await act(async () => {})
    expect(screen.queryAllByRole("button", { name: /Hide$/ })).toHaveLength(0)
  })

  it("without a translation it says so instead of failing", async () => {
    delete g.Translator
    clickAt(page(), 13)
    expect(await screen.findByText("No translation yet. Tap again in a moment")).toBeTruthy()
  })
})
