// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { makeTiles, spell } from "./unscramble-logic"
import { Unscramble } from "./unscramble"

afterEach(cleanup)

const words = [
  { lemma: "eau", translation_es: "agua", definition_fr: "", key_phrase: "" },
  { lemma: "mer", translation_es: "mar", definition_fr: "", key_phrase: "" },
]

const tap = (c: string) => fireEvent.click(screen.getAllByRole("button", { name: c }).find((b) => !(b as HTMLButtonElement).disabled)!)

describe("unscramble logic", () => {
  it("tiles are exactly the letters of the lemma", () => {
    expect(makeTiles("déchet", 3).map((t) => t.char).sort()).toEqual([..."déchet"].sort())
  })
  it("spell joins placed tiles", () => {
    expect(spell(makeTiles("eau", 1))).toHaveLength(3)
  })
})

describe("Unscramble", () => {
  it("undo returns the last tile", () => {
    render(<Unscramble words={words} onFinish={vi.fn()} onExit={vi.fn()} />)
    tap("e")
    expect(screen.getByTestId("answer").textContent).toBe("e")
    fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    expect(screen.getByTestId("answer").textContent).toBe("")
  })

  it("correct word advances; finishing reports results", () => {
    const onFinish = vi.fn()
    render(<Unscramble words={words} onFinish={onFinish} onExit={vi.fn()} />)
    for (const c of "eau") tap(c)
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    for (const c of "mer") tap(c)
    fireEvent.click(screen.getByRole("button", { name: "Finish" }))
    expect(onFinish).toHaveBeenCalledWith([
      { lemma: "eau", passed: true },
      { lemma: "mer", passed: true },
    ])
    expect(screen.getByText("Done")).toBeTruthy()
  })

  it("wrong order counts as not passed", () => {
    const onFinish = vi.fn()
    render(<Unscramble words={[words[0]]} onFinish={onFinish} onExit={vi.fn()} />)
    for (const c of "uae") tap(c)
    fireEvent.click(screen.getByRole("button", { name: "Finish" }))
    expect(onFinish).toHaveBeenCalledWith([{ lemma: "eau", passed: false }])
  })
})
