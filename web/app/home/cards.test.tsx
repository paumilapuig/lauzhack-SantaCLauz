// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { HomeClip, WordToPractice } from "@/lib/student-contract"
import { ClipCard } from "./clip-card"
import { WordCard } from "./word-card"
import { speak } from "./speech"

vi.mock("./speech", () => ({ speak: vi.fn() }))

const clip: HomeClip = {
  id: "c1",
  lesson_title: "La respiration cellulaire",
  created_at: "2026-11-21T21:10:00Z",
  t_start: 0,
  t_end: 30,
  transcript: "elle produit aussi des déchets",
  audio_url: "https://x/a.mp3",
  terms: ["déchet"],
}
const word: WordToPractice = {
  lemma: "déchet",
  translation_es: "desecho",
  definition_fr: "Ce qui reste.",
  key_phrase: "k",
  level: 0,
  clip_id: "c1",
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe("cards", () => {
  it("ClipCard shows the translation of a known term", () => {
    render(<ClipCard clip={clip} words={[word]} />)
    expect(screen.getByText("desecho")).toBeTruthy()
  })

  it("falls back to speak when audio play rejects", async () => {
    vi.stubGlobal("Audio", class { play = () => Promise.reject(new Error("no")) })
    render(<ClipCard clip={clip} words={[word]} />)
    fireEvent.click(screen.getByRole("button", { name: /Escuchar/ }))
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1))
    expect(speak).toHaveBeenCalledWith(clip.transcript, 0.85)
  })

  it("WordCard calls onPractice", () => {
    const onPractice = vi.fn()
    render(<WordCard word={word} onPractice={onPractice} />)
    fireEvent.click(screen.getByRole("button", { name: "Practicar" }))
    expect(onPractice).toHaveBeenCalledTimes(1)
  })
})
