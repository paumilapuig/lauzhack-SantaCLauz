// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LiveSubtitles } from "./LiveSubtitles";

afterEach(cleanup);

describe("LiveSubtitles", () => {
  it("shows the line on a single line when visible", () => {
    render(<LiveSubtitles text="le cycle de l'eau" visible />);
    const line = screen.getByText("le cycle de l'eau");
    expect(line.className).toContain("whitespace-nowrap");
  });

  it("shows nothing when hidden", () => {
    render(<LiveSubtitles text="la chaleur" visible={false} />);
    expect(screen.queryByText("la chaleur")).toBeNull();
  });
});
