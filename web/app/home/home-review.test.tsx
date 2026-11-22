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
const translateFrToEs = vi.fn<(text: string) => Promise<string | null>>(async () => null)
vi.mock("./translate/browser-translator", () => ({
  translateFrToEs: (text: string) => translateFrToEs(text),
  prepareTranslator: vi.fn(),
}))

beforeEach(() => {
  api = createFakeHomeApi()
  localStorage.clear()
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

  it("a marked word shows its Spanish right away: the glossary's, else the browser's", async () => {
    vi.spyOn(api, "mark").mockResolvedValue({ word: "mitochondries", lemma: null, translation_es: null, level: null })
    translateFrToEs.mockResolvedValueOnce("mitocondrias")
    render(<HomeReview />)
    fireEvent.click((await screen.findAllByRole("button", { name: /mitochondries/i }))[0])
    expect(await screen.findByText("mitocondrias")).toBeTruthy()
    expect(translateFrToEs).toHaveBeenCalledWith("mitochondries")
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

  it("finishing a mode saves practice and shows what Loop'd now knows", async () => {
    const practice = vi.spyOn(api, "practice")
    render(<HomeReview />)
    const rail = await screen.findByRole("complementary", { name: "Practice" })
    fireEvent.click(within(rail).getByRole("button", { name: /Flashcards/ }))
    expect(screen.getByRole("dialog", { name: "Flashcards" })).toBeTruthy()
    while (screen.queryByText("Tap to see")) {
      fireEvent.click(screen.getByText("Tap to see"))
      fireEvent.click(screen.getByText("I knew it"))
    }
    await waitFor(() => expect(practice).toHaveBeenCalledWith(expect.objectContaining({ lemma: "déchet", passed: true })))
    expect(await screen.findByText("help with", { exact: false })).toBeTruthy()
    expect(screen.getAllByText("What Loop'd knows").length).toBeGreaterThan(0)
  })

  it("Vocab shows only the clips and the practice list; Context holds the ideas from class", async () => {
    render(<HomeReview />)
    await screen.findByText("2 to review")
    expect(screen.queryByRole("region", { name: "To understand better" })).toBeNull()
    expect(screen.getByRole("complementary", { name: "Practice" })).toBeTruthy()
    fireEvent.click(screen.getByRole("tab", { name: /Context/ }))
    expect(screen.getByRole("tab", { name: /Context/ }).getAttribute("aria-selected")).toBe("true")
    expect(screen.getByRole("region", { name: "To understand better" })).toBeTruthy()
    expect(screen.queryByText("2 to review")).toBeNull()
  })

  it("the tabs show how much is left on each path", async () => {
    render(<HomeReview />)
    await screen.findByText("2 to review")
    expect(screen.getByRole("tab", { name: /Vocab/ }).textContent).toContain("2")
    expect(screen.getByRole("tab", { name: /Context/ }).textContent).toContain("1")
  })

  it("a finished game gets a check and the next game is suggested", async () => {
    render(<HomeReview />)
    const rail = await screen.findByRole("complementary", { name: "Practice" })
    expect(within(rail).getByRole("button", { name: /Flashcards/ }).textContent).toContain("For you")
    fireEvent.click(within(rail).getByRole("button", { name: /Flashcards/ }))
    while (screen.queryByText("Tap to see")) {
      fireEvent.click(screen.getByText("Tap to see"))
      fireEvent.click(screen.getByText("I knew it"))
    }
    fireEvent.click(await screen.findByRole("button", { name: "Back" }))
    const updated = await screen.findByRole("complementary", { name: "Practice" })
    await waitFor(() => expect(within(updated).getByRole("button", { name: /Flashcards/ }).textContent).toContain("Done today"))
    expect(within(updated).getByRole("button", { name: /Step by step/ }).textContent).toContain("For you")
  })

  it("today's plan stays above the tabs; a finished game is checked off and leaves the to-do (bug Sun 22 Nov)", async () => {
    render(<HomeReview />)
    const plan = await screen.findByRole("region", { name: /Your next/ })
    const practiseRow = within(plan).getByRole("button", { name: /Practise with Flashcards/ })
    expect(practiseRow.textContent).not.toContain("Done")
    fireEvent.click(practiseRow)
    while (screen.queryByText("Tap to see")) {
      fireEvent.click(screen.getByText("Tap to see"))
      fireEvent.click(screen.getByText("I knew it"))
    }
    fireEvent.click(await screen.findByRole("button", { name: "Back" }))
    await waitFor(() => expect(within(plan).getByRole("button", { name: /Practise with Flashcards/ }).textContent).toContain("Done"))
    expect(within(plan).queryAllByRole("button", { name: /Practise with/ })).toHaveLength(1)
    fireEvent.click(screen.getByRole("tab", { name: /Context/ }))
    expect(screen.getByRole("region", { name: /Your next/ })).toBe(plan)
  })
})
