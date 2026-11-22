// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HomeReview } from "./home-review"
import { savePractice } from "./data"

vi.mock("next/navigation", () => ({ usePathname: () => "/home" }))
vi.mock("next/font/google", () => ({ Plus_Jakarta_Sans: () => ({ variable: "" }) }))
vi.mock("./speech", () => ({ speak: vi.fn() }))
vi.mock("./data", async (importActual) => ({
  ...(await importActual<typeof import("./data")>()),
  savePractice: vi.fn(async (r: { lemma: string }) => ({ lemma: r.lemma, level: 1, leveled_up: true })),
}))

afterEach(cleanup)

describe("HomeReview", () => {
  it("tapping a clip word marks it yellow (saved, no word list UI)", async () => {
    const { container } = render(<HomeReview />)
    const word = await screen.findByRole("button", { name: /mitochondries/i })
    fireEvent.click(word)
    await waitFor(() => expect(container.querySelector('[data-state="yellow"]')).not.toBeNull())
    expect(screen.queryByText("Tus palabras")).toBeNull()
  })

  it("opens a mode in a dialog over the page and Cerrar closes it without saving", async () => {
    render(<HomeReview />)
    fireEvent.click(await screen.findByRole("button", { name: /Tarjetas/ }))
    expect(screen.getByRole("dialog", { name: "Tarjetas" })).toBeTruthy()
    expect(screen.getByRole("heading", { level: 1, name: /^Repasar/, hidden: true })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(savePractice).not.toHaveBeenCalled()
  })

  it("finishing a mode saves practice per word", async () => {
    render(<HomeReview />)
    fireEvent.click(await screen.findByRole("button", { name: /Tarjetas/ }))
    while (screen.queryByText("Hecho") === null) {
      fireEvent.click(screen.getByText("Toca para ver"))
      fireEvent.click(screen.getByText("Lo sabía"))
    }
    await waitFor(() => expect(savePractice).toHaveBeenCalledWith(expect.objectContaining({ lemma: "déchets", passed: true })))
    expect(vi.mocked(savePractice).mock.calls.length).toBeGreaterThanOrEqual(3)
  })
})
