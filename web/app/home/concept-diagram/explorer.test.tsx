// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { FAKE_CONCEPT } from "../fakeConcept"
import { ConceptExplorer } from "./explorer"

afterEach(cleanup)

const onTapWord = vi.fn(async (_id: string, word: string) => ({ word, lemma: null, translation_es: null, level: null }))
const sentence = () => screen.getByText((_, el) => el?.tagName === "P" && el.className.includes("text-[20px]")).textContent

describe("ConceptExplorer", () => {
  it("jumps to a step from the progress dots", () => {
    render(<ConceptExplorer gap={FAKE_CONCEPT} onTapWord={onTapWord} questions={<p>questions</p>} />)
    fireEvent.click(screen.getByRole("button", { name: "Step 3" }))
    expect(sentence()).toBe("La respiration cellulaire utilise de l'oxygène.")
    expect(screen.getByRole("button", { name: "Step 3" }).getAttribute("aria-current")).toBe("step")
  })

  it("jumps to the step of a box when the box is clicked", () => {
    render(<ConceptExplorer gap={FAKE_CONCEPT} onTapWord={onTapWord} questions={<p>questions</p>} />)
    fireEvent.click(screen.getByText("La respiration cellulaire", { selector: "[title='Step 2'] span" }))
    expect(sentence()).toBe("La respiration cellulaire fabrique l'énergie.")
    expect(onTapWord).not.toHaveBeenCalled()
  })

  it("numbers process boxes and never shows emoji", () => {
    render(<ConceptExplorer gap={FAKE_CONCEPT} onTapWord={onTapWord} questions={<p>questions</p>} />)
    const figure = screen.getByRole("figure")
    expect(figure.textContent).toContain("2La respiration cellulaire")
    expect(figure.textContent).not.toMatch(/\p{Extended_Pictographic}/u)
  })

  it("going back to a step hides the questions again", () => {
    render(<ConceptExplorer gap={FAKE_CONCEPT} onTapWord={onTapWord} questions={<p>questions</p>} />)
    fireEvent.click(screen.getByRole("button", { name: "Step 3" }))
    fireEvent.click(screen.getByRole("button", { name: /Check what you understood/ }))
    expect(screen.getByText("questions")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Step 1" }))
    expect(screen.queryByText("questions")).toBeNull()
  })
})
