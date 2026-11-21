// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { StudentNav } from "./student-nav"

vi.mock("next/navigation", () => ({ usePathname: () => "/progress" }))

afterEach(cleanup)

describe("StudentNav", () => {
  it("renders two tab links with the right hrefs", () => {
    render(<StudentNav variant="tabbar" />)
    expect(screen.getByRole("link", { name: "Repasar" }).getAttribute("href")).toBe("/home")
    expect(screen.getByRole("link", { name: "Progreso" }).getAttribute("href")).toBe("/progress")
  })

  it("marks only the active tab with aria-current", () => {
    render(<StudentNav variant="tabbar" />)
    expect(screen.getByRole("link", { name: "Progreso" }).getAttribute("aria-current")).toBe("page")
    expect(screen.getByRole("link", { name: "Repasar" }).getAttribute("aria-current")).toBeNull()
  })

  it("sidebar variant keeps the same links and active state", () => {
    render(<StudentNav variant="sidebar" />)
    expect(screen.getByRole("link", { name: "Repasar" }).getAttribute("href")).toBe("/home")
    expect(screen.getByRole("link", { name: "Progreso" }).getAttribute("aria-current")).toBe("page")
  })
})
