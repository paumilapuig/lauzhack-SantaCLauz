// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ConceptCard } from "./concept-card"

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

describe("ConceptCard", () => {
  it("shows the idea step by step with its Spanish help, never saying she got lost", () => {
    render(<ConceptCard gap={gap} onAnswer={vi.fn()} onUnderstood={vi.fn()} />)
    expect(screen.getByText("Comment la cellule fabrique de l'énergie")).toBeTruthy()
    expect(screen.getByText("La célula recibe azúcar.")).toBeTruthy()
    expect(screen.queryByText(/lost|perdu/i)).toBeNull()
  })

  it("checks the answers and shows which were right", async () => {
    const onAnswer = vi.fn(async () => ({ correct: [true, false], status: "review" as const }))
    render(<ConceptCard gap={gap} onAnswer={onAnswer} onUnderstood={vi.fn()} />)
    fireEvent.click(screen.getByLabelText("de l'énergie"))
    fireEvent.click(screen.getByLabelText("de l'eau"))
    fireEvent.click(screen.getByRole("button", { name: "Check" }))
    expect(onAnswer).toHaveBeenCalledWith("g1", [0, 0])
    expect(await screen.findByText("1 of 2 right. Read the steps again and retry.")).toBeTruthy()
  })

  it("tells the page when everything is right", async () => {
    const onUnderstood = vi.fn()
    const onAnswer = vi.fn(async () => ({ correct: [true, true], status: "understood" as const }))
    render(<ConceptCard gap={gap} onAnswer={onAnswer} onUnderstood={onUnderstood} />)
    fireEvent.click(screen.getByLabelText("de l'énergie"))
    fireEvent.click(screen.getByLabelText("du sucre", { selector: "input[name='g1-1']" }))
    fireEvent.click(screen.getByRole("button", { name: "Check" }))
    await waitFor(() => expect(onUnderstood).toHaveBeenCalledWith("g1"))
  })
})
