// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Layers, Link2 } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PracticeModesGrid } from "./practice-modes-grid";

afterEach(cleanup);

const modes = [
  { id: "flashcards", name: "Flashcards", description: "Flip and remember", icon: Layers, minWords: 1, needs: [] },
  { id: "pairs", name: "Pairs", description: "Match each word", icon: Link2, minWords: 2, needs: [] },
];

describe("PracticeModesGrid", () => {
  it("shows every mode as a big block and opens the chosen one", () => {
    const onOpen = vi.fn();
    render(<PracticeModesGrid modes={modes} wordCount={2} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: /Flashcards/ }));
    expect(onOpen).toHaveBeenCalledWith("flashcards");
    expect(screen.getByRole("button", { name: /Pairs/ })).toBeTruthy();
  });

  it("disables a mode that needs more words and says why", () => {
    const onOpen = vi.fn();
    render(<PracticeModesGrid modes={modes} wordCount={1} onOpen={onOpen} />);
    const pairs = screen.getByRole("button", { name: /Pairs/ });
    expect(pairs.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText("You need at least 2 words")).toBeTruthy();
    fireEvent.click(pairs);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
