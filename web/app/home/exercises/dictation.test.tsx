// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Dictation } from "./dictation"
import { spellingMatches } from "./dictation-logic"

vi.mock("../speech", () => ({ speak: vi.fn() }))
import { speak } from "../speech"

afterEach(cleanup)

const words = [
  { lemma: "déchet", translation_es: "residuo", definition_fr: "d", key_phrase: "k" },
  { lemma: "tri", translation_es: "separación", definition_fr: "d", key_phrase: "k" },
]

describe("spellingMatches", () => {
  it("ignores accents, case and spaces", () => {
    expect(spellingMatches("dechet", "déchet")).toBe(true)
    expect(spellingMatches("  DÉCHET ", "déchet")).toBe(true)
    expect(spellingMatches("dechets", "déchet")).toBe(false)
  })
})

describe("Dictation", () => {
  it("speaks the word, then checks, shows spelling and finishes", () => {
    const onFinish = vi.fn()
    render(<Dictation words={words} onFinish={onFinish} onExit={vi.fn()} />)
    expect(speak).toHaveBeenCalledWith("déchet", expect.any(Number))
    const type = (v: string) => fireEvent.change(screen.getByLabelText("Write what you hear"), { target: { value: v } })
    type("dechet")
    fireEvent.click(screen.getByText("Check"))
    expect(screen.getByText("déchet")).toBeTruthy()
    fireEvent.click(screen.getByText("Next"))
    type("xx")
    fireEvent.click(screen.getByText("Check"))
    fireEvent.click(screen.getByText("Next"))
    expect(onFinish).toHaveBeenCalledWith([
      { lemma: "déchet", passed: true },
      { lemma: "tri", passed: false },
    ])
  })
})
