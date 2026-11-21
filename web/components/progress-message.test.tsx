// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ProgressMessage } from "./progress-message"

afterEach(cleanup)

describe("ProgressMessage", () => {
  it.each([
    ["learned_this_week", "lucide-sprout"],
    ["no_help_needed", "lucide-badge-check"],
    ["keep_going", "lucide-footprints"],
  ] as const)("renders %s text and icon", (kind, iconClass) => {
    const { container } = render(<ProgressMessage message={{ kind, text: "Hola" }} />)
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Hola")
    const svg = container.querySelector("svg")
    expect(svg?.classList.contains(iconClass)).toBe(true)
    expect(svg?.getAttribute("aria-hidden")).toBe("true")
  })
})
