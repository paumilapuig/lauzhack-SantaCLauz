// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createFakeHomeApi } from "./fakeHomeApi"
import type { HomeApi } from "./homeApi"
import { HomeReview } from "./home-review"

let api: HomeApi
vi.mock("next/navigation", () => ({ usePathname: () => "/home" }))
vi.mock("./speech", () => ({ speak: vi.fn() }))
vi.mock("./getHomeApi", () => ({ getHomeApi: () => api }))

beforeEach(() => {
  api = createFakeHomeApi()
})
afterEach(cleanup)

describe("HomeReview", () => {
  it("lists the pending clips; tapping a word marks it on the server and shows it yellow", async () => {
    const mark = vi.spyOn(api, "mark")
    const { container } = render(<HomeReview />)
    expect(await screen.findByText("2 to review")).toBeTruthy()
    fireEvent.click((await screen.findAllByRole("button", { name: /mitochondries/i }))[0])
    await waitFor(() => expect(container.querySelector('[data-state="yellow"]')).not.toBeNull())
    expect(mark).toHaveBeenCalledWith(expect.any(String), "mitochondries")
  })

  it("Done removes a clip; with no clip left the practice modes fill the page as big blocks", async () => {
    render(<HomeReview />)
    await screen.findByText("2 to review")
    fireEvent.click(screen.getAllByRole("button", { name: "Done" })[0])
    expect(await screen.findByText("1 to review")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Done" }))
    const practice = await screen.findByRole("region", { name: "Practice" })
    expect(within(practice).getByRole("button", { name: /Flashcards/ })).toBeTruthy()
    expect(screen.queryByText(/^\d+ to review$/)).toBeNull()
  })

  it("Discard unmarks the clip's words and removes the clip", async () => {
    const unmark = vi.spyOn(api, "unmark")
    const finishClip = vi.spyOn(api, "finishClip")
    const { container } = render(<HomeReview />)
    await screen.findByText("2 to review")
    fireEvent.click((await screen.findAllByRole("button", { name: /mitochondries/i }))[0])
    await waitFor(() => expect(container.querySelector('[data-state="yellow"]')).not.toBeNull())
    fireEvent.click(screen.getAllByRole("button", { name: "Discard" })[0])
    expect(await screen.findByText("1 to review")).toBeTruthy()
    expect(unmark).toHaveBeenCalledWith(expect.any(String), "mitochondries")
    expect(finishClip).toHaveBeenCalledTimes(1)
  })

  it("finishing a mode saves practice for glossary words only", async () => {
    const practice = vi.spyOn(api, "practice")
    render(<HomeReview />)
    fireEvent.click(await screen.findByRole("button", { name: /Flashcards/ }))
    expect(screen.getByRole("dialog", { name: "Flashcards" })).toBeTruthy()
    while (screen.queryByText("Leveled up:", { exact: false }) === null && screen.queryByRole("button", { name: "Back" }) === null) {
      fireEvent.click(screen.getByText("Tap to see"))
      fireEvent.click(screen.getByText("I knew it"))
    }
    await waitFor(() => expect(practice).toHaveBeenCalledWith(expect.objectContaining({ lemma: "déchet", passed: true })))
  })
})
