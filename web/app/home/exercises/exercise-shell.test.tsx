// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ExerciseShell } from "./exercise-shell"

afterEach(cleanup)

const base = { title: "Tarjetas", current: 1, total: 6, onExit: vi.fn() }

describe("ExerciseShell", () => {
  it("labels the region, shows children, renders no h1 or own exit", () => {
    render(<ExerciseShell {...base}><p>contenido</p></ExerciseShell>)
    expect(screen.getByRole("region", { name: "Tarjetas" })).toBeTruthy()
    expect(screen.getByText("contenido")).toBeTruthy()
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull()
    expect(screen.queryByRole("button", { name: "Salir" })).toBeNull()
  })

  it("end screen lists passed and failed words, no digits, Volver exits", () => {
    const onExit = vi.fn()
    const { container } = render(
      <ExerciseShell {...base} onExit={onExit} results={[
        { lemma: "déchet", passed: true },
        { lemma: "énergie", passed: false },
      ]}><p>contenido</p></ExerciseShell>,
    )
    expect(screen.getByText("Hecho")).toBeTruthy()
    expect(screen.getByText(/Sube de nivel: déchet/)).toBeTruthy()
    expect(screen.getByText(/Para repasar otra vez: énergie/)).toBeTruthy()
    expect(screen.queryByText("contenido")).toBeNull()
    expect(container.textContent).not.toMatch(/\d|%/)
    fireEvent.click(screen.getByRole("button", { name: "Volver" }))
    expect(onExit).toHaveBeenCalled()
  })

  it("omits the review line when everything passed", () => {
    render(<ExerciseShell {...base} results={[{ lemma: "déchet", passed: true }]}><p /></ExerciseShell>)
    expect(screen.queryByText(/Para repasar/)).toBeNull()
  })
})
