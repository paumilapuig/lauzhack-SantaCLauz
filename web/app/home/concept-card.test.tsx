// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ConceptCard } from "./concept-card"
import { FAKE_CONCEPT } from "./fakeConcept"

afterEach(cleanup)

const gap = {
  id: "g1",
  lesson_title: "La respiration cellulaire",
  concept: "Comment la cellule fabrique de l'énergie",
  lemmas: ["mitochondrie"],
  explanation: [
    { fr: "La cellule reçoit du sucre.", es: "La célula recibe azúcar.", visual: "🍞 → 🔋" },
    { fr: "La mitochondrie fait de l'énergie.", es: "La mitocondria hace energía.", visual: "⚙️ → ⚡" },
  ],
  exercises: [
    { question: "Que fabrique la mitochondrie ?", options: ["de l'énergie", "du sucre"] },
    { question: "Que reçoit la cellule ?", options: ["de l'eau", "du sucre"] },
  ],
  status: "pending" as const,
}

/** Walk an older idea (no boxes) to its last step and open its questions. */
function openQuestions() {
  fireEvent.click(screen.getByRole("button", { name: /Next step/ }))
  fireEvent.click(screen.getByRole("button", { name: /Check what you understood/ }))
}

describe("ConceptCard", () => {
  it("draws an older idea (no boxes) as a strip of steps with its emoji, Spanish on demand, never saying she got lost", () => {
    render(<ConceptCard gap={gap} onAnswer={vi.fn()} onUnderstood={vi.fn()} onTapWord={vi.fn()} />)
    expect(screen.getByText("Comment la cellule fabrique de l'énergie")).toBeTruthy()
    const diagram = screen.getByRole("figure", { name: "Diagram of the idea, step by step" })
    expect(diagram.textContent).toContain("🍞 → 🔋")
    expect(diagram.textContent).toContain("⚙️ → ⚡")
    fireEvent.click(screen.getByRole("button", { name: "Show in Spanish" }))
    expect(screen.getByText("La célula recibe azúcar.")).toBeTruthy()
    expect(screen.queryByText(/lost|perdu/i)).toBeNull()
  })

  it("checks the answers and shows which were right", async () => {
    const onAnswer = vi.fn(async () => ({ correct: [true, false], status: "review" as const }))
    render(<ConceptCard gap={gap} onAnswer={onAnswer} onUnderstood={vi.fn()} onTapWord={vi.fn()} />)
    openQuestions()
    fireEvent.click(screen.getByLabelText("de l'énergie"))
    fireEvent.click(screen.getByLabelText("de l'eau"))
    fireEvent.click(screen.getByRole("button", { name: "Check" }))
    expect(onAnswer).toHaveBeenCalledWith("g1", [0, 0])
    expect(await screen.findByText("Some answers are not right yet. Read the steps again and retry.")).toBeTruthy()
  })

  it("tells the page when everything is right", async () => {
    const onUnderstood = vi.fn()
    const onAnswer = vi.fn(async () => ({ correct: [true, true], status: "understood" as const }))
    render(<ConceptCard gap={gap} onAnswer={onAnswer} onUnderstood={onUnderstood} onTapWord={vi.fn()} />)
    openQuestions()
    fireEvent.click(screen.getByLabelText("de l'énergie"))
    fireEvent.click(screen.getByLabelText("du sucre", { selector: "input[name='g1-1']" }))
    fireEvent.click(screen.getByRole("button", { name: "Check" }))
    await waitFor(() => expect(onUnderstood).toHaveBeenCalledWith("g1"))
  })

  it("never shows a number out of a total to the student", async () => {
    const onAnswer = vi.fn(async () => ({ correct: [true, false], status: "review" as const }))
    render(<ConceptCard gap={gap} onAnswer={onAnswer} onUnderstood={vi.fn()} onTapWord={vi.fn()} />)
    openQuestions()
    fireEvent.click(screen.getByLabelText("de l'énergie"))
    fireEvent.click(screen.getByLabelText("de l'eau"))
    fireEvent.click(screen.getByRole("button", { name: "Check" }))
    await screen.findByRole("status")
    expect(screen.queryByText(/\d+ of \d+/)).toBeNull()
  })
})

describe("ConceptCard with a diagram", () => {
  const onTapWord = vi.fn(async (_id: string, word: string) => ({ word, lemma: null, translation_es: "oxígeno", level: null }))

  it("draws the diagram without emoji and walks it step by step", () => {
    render(<ConceptCard gap={FAKE_CONCEPT} onAnswer={vi.fn()} onUnderstood={vi.fn()} onTapWord={onTapWord} />)
    expect(screen.getByRole("figure", { name: "Diagram of the idea, step by step" })).toBeTruthy()
    expect(screen.queryByText(/\p{Extended_Pictographic}/u)).toBeNull()
    expect(screen.queryByRole("button", { name: "Check" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /Explore: La respiration cellulaire/ }))
    fireEvent.click(screen.getByRole("button", { name: /Explore: L'oxygène/ }))
    fireEvent.click(screen.getByRole("button", { name: /Check what you understood/ }))
    expect(screen.getByRole("button", { name: "Check" })).toBeTruthy()
  })

  it("shows Spanish only when asked", () => {
    render(<ConceptCard gap={FAKE_CONCEPT} onAnswer={vi.fn()} onUnderstood={vi.fn()} onTapWord={onTapWord} />)
    expect(screen.queryByText("La célula usa la comida para tener energía.")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Show in Spanish" }))
    expect(screen.getByText("La célula usa la comida para tener energía.")).toBeTruthy()
  })

  it("translates a tapped word at once and saves it", async () => {
    render(<ConceptCard gap={FAKE_CONCEPT} onAnswer={vi.fn()} onUnderstood={vi.fn()} onTapWord={onTapWord} />)
    fireEvent.click(screen.getAllByRole("button", { name: "nourriture" })[0])
    expect(screen.getByRole("status").textContent).toContain("comida")
    expect(onTapWord).toHaveBeenCalledWith("g1…", "nourriture", expect.any(String))
  })
})
