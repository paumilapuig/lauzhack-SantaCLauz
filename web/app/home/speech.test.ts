import { afterEach, describe, expect, it, vi } from "vitest";
import { listenOnce, speak } from "./speech";

afterEach(() => vi.unstubAllGlobals());

describe("speech", () => {
  it("listenOnce resolves null without SpeechRecognition", async () => {
    expect(await listenOnce("es-ES")).toBeNull();
  });

  it("speak is a no-op without speechSynthesis", () => {
    expect(() => speak("hola", 1)).not.toThrow();
  });

  it("speak uses fr-FR and the given rate", () => {
    const cancel = vi.fn();
    const spoken = vi.fn();
    vi.stubGlobal("SpeechSynthesisUtterance", function (this: { text: string }, text: string) {
      this.text = text;
    });
    vi.stubGlobal("speechSynthesis", { cancel, speak: spoken });
    speak("bonjour", 0.85);
    expect(cancel).toHaveBeenCalled();
    const utterance = spoken.mock.calls[0][0];
    expect(utterance).toMatchObject({ text: "bonjour", lang: "fr-FR", rate: 0.85 });
  });
});
