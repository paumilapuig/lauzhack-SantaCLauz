// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LiveSubtitles } from "./LiveSubtitles";

afterEach(cleanup);

describe("LiveSubtitles", () => {
  it("shows finished lines and the interim line by default with the toggle pressed", () => {
    render(<LiveSubtitles lines={{ finals: ["le cycle de l'eau"], interim: "la chaleur" }} />);
    const toggle = screen.getByRole("button", { name: "Ocultar subtítulos" });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("le cycle de l'eau")).toBeTruthy();
    expect(screen.getByText("la chaleur")).toBeTruthy();
  });

  it("hides the text when toggled off and shows it again when toggled on", () => {
    const { rerender } = render(<LiveSubtitles lines={{ finals: ["la chaleur"], interim: "" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Ocultar subtítulos" }));

    const toggle = screen.getByRole("button", { name: "Mostrar subtítulos" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByText("la chaleur")).toBeNull();

    rerender(<LiveSubtitles lines={{ finals: ["les déchets"], interim: "" }} />);
    expect(screen.queryByText("les déchets")).toBeNull();

    fireEvent.click(toggle);
    expect(screen.getByText("les déchets")).toBeTruthy();
  });
});
