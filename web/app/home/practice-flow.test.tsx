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
const abort = vi.fn();
const mockHeard = (heard: string | null) =>
  vi.mocked(listenOnce).mockReturnValue({ result: Promise.resolve(heard), abort });
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
    mockHeard(null);
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
    mockHeard("des déchets");
    await reachSpeaking();
    fireEvent.click(screen.getByRole("button", { name: /Hablar/ }));
    await waitFor(() => expect(screen.getByText("¡Muy bien!")).toBeTruthy());
  });

  it("shows an error and lets her retry when saving fails", async () => {
    mockHeard(null);
    vi.mocked(savePractice).mockRejectedValueOnce(new Error("down"));
    await reachSpeaking();
    fireEvent.click(screen.getByRole("button", { name: /Hablar/ }));
    await screen.findByText("No se ha podido guardar. Inténtalo otra vez.");
    expect(screen.queryByText("déchet sube de nivel")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Hablar/ }));
    await screen.findByText("déchet sube de nivel");
    expect(screen.queryByText(/No se ha podido guardar/)).toBeNull();
  });

  it("does not save after unmount and aborts listening", async () => {
    let resolveHeard: (v: string | null) => void = () => {};
    vi.mocked(listenOnce).mockReturnValue({ result: new Promise((r) => (resolveHeard = r)), abort });
    const cancel = vi.fn();
    vi.stubGlobal("speechSynthesis", { cancel });
    const view = render(<PracticeFlow word={word} onDone={onDone} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "déchet" }));
    fireEvent.click(screen.getByRole("button", { name: "déchets" }));
    fireEvent.click(await screen.findByRole("button", { name: /Hablar/ }));
    view.unmount();
    resolveHeard(null);
    await Promise.resolve();
    expect(abort).toHaveBeenCalled();
    expect(cancel).toHaveBeenCalled();
    expect(savePractice).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("moves focus to the new step heading", () => {
    render(<PracticeFlow word={word} onDone={onDone} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "déchet" }));
    expect(document.activeElement?.textContent).toContain("Completa la frase");
  });
});
