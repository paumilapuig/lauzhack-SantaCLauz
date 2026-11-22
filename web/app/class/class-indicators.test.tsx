// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MicIndicator } from "./MicIndicator";
import { SpeechStatusBadge } from "./SpeechStatusBadge";

afterEach(cleanup);

describe("MicIndicator", () => {
  it("tells the student in French whether to move closer", () => {
    const { rerender } = render(<MicIndicator level="quiet" />);
    expect(screen.getByText("Son faible · rapproche-toi")).toBeTruthy();
    rerender(<MicIndicator level="good" />);
    expect(screen.getByText("Son : bon")).toBeTruthy();
    rerender(<MicIndicator level="loud" />);
    expect(screen.getByText("Trop fort · éloigne-toi un peu")).toBeTruthy();
  });
});

describe("SpeechStatusBadge", () => {
  it("shows live and reconnecting without the plan B button", () => {
    render(<SpeechStatusBadge status="live" planBPlaying={false} onPlanB={vi.fn()} />);
    expect(screen.getByText("En direct")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("offers the lesson text as plan B when offline", () => {
    const onPlanB = vi.fn();
    render(<SpeechStatusBadge status="offline" planBPlaying={false} onPlanB={onPlanB} />);
    expect(screen.getByText("Hors ligne · sous-titres en pause")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Lire le texte de la leçon" }));
    expect(onPlanB).toHaveBeenCalled();
  });

  it("says when the lesson text is playing", () => {
    render(<SpeechStatusBadge status="offline" planBPlaying onPlanB={vi.fn()} />);
    expect(screen.getByText("Texte de la leçon (plan B)")).toBeTruthy();
  });
});
