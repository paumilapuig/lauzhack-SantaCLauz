// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PracticeFlow } from "./practice-flow";
import { listenOnce } from "./speech";
import { savePractice } from "./data";

vi.mock("./speech", () => ({ speak: vi.fn(), listenOnce: vi.fn() }));
vi.mock("./data", () => ({
  DISTRACTORS: ["chaleur", "nourriture", "fournir"],
  savePractice: vi.fn(async () => ({ lemma: "déchet", level: 1, leveled_up: true })),
}));

const word = {
  lemma: "déchet",
  translation_es: "desecho",
  definition_fr: "Ce qui reste.",
  key_phrase: "Elle produit aussi des déchets : de l'eau.",
  level: 0,
  clip_id: "c1",
};

const onDone = vi.fn();
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

async function reachSpeaking() {
  render(<PracticeFlow word={word} onDone={onDone} onExit={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "chaleur" }));
  expect(screen.getByText("Casi. Prueba otra vez.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "déchet" }));
  expect(screen.getByText(/____/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "déchets" }));
  await screen.findByRole("button", { name: /Hablar/ });
}

describe("PracticeFlow", () => {
  it("shows the word header and Salir leaves without saving", () => {
    render(<PracticeFlow word={word} onDone={onDone} onExit={onDone} />);
    expect(screen.getByText("Practicamos")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "déchet" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    expect(onDone).toHaveBeenCalled();
    expect(savePractice).not.toHaveBeenCalled();
  });

  it("falls back when nothing is heard, still passes, saves once", async () => {
    vi.mocked(listenOnce).mockResolvedValue(null);
    await reachSpeaking();
    fireEvent.click(screen.getByRole("button", { name: /Hablar/ }));
    await screen.findByText(/No te hemos oído bien/);
    await screen.findByText("déchet sube de nivel");
    expect(savePractice).toHaveBeenCalledTimes(1);
    expect(savePractice).toHaveBeenCalledWith({ lemma: "déchet", clip_id: "c1", passed: true });
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(onDone).toHaveBeenCalledWith("déchet");
  });

  it("praises a matching answer", async () => {
    vi.mocked(listenOnce).mockResolvedValue("des déchets");
    await reachSpeaking();
    fireEvent.click(screen.getByRole("button", { name: /Hablar/ }));
    await waitFor(() => expect(screen.getByText("¡Muy bien!")).toBeTruthy());
  });
});
