// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { StudentNav } from "./student-nav"

vi.mock("next/navigation", () => ({ usePathname: () => "/progress" }))

afterEach(cleanup)

describe("StudentNav", () => {
  it("renders Clase, Repasar and Progreso with the right hrefs", () => {
    render(<StudentNav variant="tabbar" />)
    expect(screen.getByRole("link", { name: "Class" }).getAttribute("href")).toBe("/class")
    expect(screen.getByRole("link", { name: "Review" }).getAttribute("href")).toBe("/home")
    expect(screen.getByRole("link", { name: "Progress" }).getAttribute("href")).toBe("/progress")
  })

  it("marks only the active tab with aria-current", () => {
    render(<StudentNav variant="tabbar" />)
    expect(screen.getByRole("link", { name: "Progress" }).getAttribute("aria-current")).toBe("page")
    expect(screen.getByRole("link", { name: "Review" }).getAttribute("aria-current")).toBeNull()
    expect(screen.getByRole("link", { name: "Class" }).getAttribute("aria-current")).toBeNull()
  })

  it("topbar keeps the same links and active state", () => {
    render(<StudentNav variant="topbar" />)
    expect(screen.getByRole("link", { name: "Class" }).getAttribute("href")).toBe("/class")
    expect(screen.getByRole("link", { name: "Progress" }).getAttribute("aria-current")).toBe("page")
  })
})
