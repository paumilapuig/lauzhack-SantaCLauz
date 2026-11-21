// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BigButton } from "./big-button";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("BigButton", () => {
  it("renders the label of each variant", () => {
    render(<BigButton variant="unclear" onPress={() => {}} />);
    render(<BigButton variant="lost" onPress={() => {}} />);
    expect(screen.getByText("No he entendido")).toBeTruthy();
    expect(screen.getByText("Me he perdido")).toBeTruthy();
  });

  it("calls onPress once, shows Guardado and ignores a second click", () => {
    const onPress = vi.fn();
    render(<BigButton variant="lost" onPress={onPress} />);
    const button = screen.getByRole("button") as HTMLButtonElement;
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(button.textContent).toContain("Guardado");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("Guardado");
  });

  it("restores label and enabled state after 2 s", () => {
    render(<BigButton variant="unclear" onPress={() => {}} />);
    const button = screen.getByRole("button") as HTMLButtonElement;
    fireEvent.click(button);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("No he entendido")).toBeTruthy();
    expect(button.getAttribute("aria-disabled")).toBe("false");
  });
});
