// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SubtitleSwitch } from "./SubtitleSwitch";

afterEach(cleanup);

describe("SubtitleSwitch", () => {
  it("is a switch labelled Sous-titres that reflects its state", () => {
    render(<SubtitleSwitch checked onChange={() => {}} />);
    const toggle = screen.getByRole("switch", { name: "Sous-titres" });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("asks to flip the state when clicked", () => {
    const onChange = vi.fn();
    render(<SubtitleSwitch checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch", { name: "Sous-titres" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
