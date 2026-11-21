import { afterEach, describe, expect, it, vi } from "vitest";
import { listenOnce, speak } from "./speech";

afterEach(() => vi.unstubAllGlobals());

describe("speech", () => {
  it("listenOnce resolves null without SpeechRecognition", async () => {
    expect(await listenOnce("es-ES").result).toBeNull();
  });

  it("abort stops recognition and resolves null", async () => {
    const abort = vi.fn();
    function FakeRecognition(this: { onend?: () => void; start: () => void; abort: () => void }) {
      this.start = () => {};
      this.abort = () => {
        abort();
        this.onend?.();
      };
    }
    vi.stubGlobal("window", { SpeechRecognition: FakeRecognition });
    const listening = listenOnce("fr-FR");
    listening.abort();
    expect(await listening.result).toBeNull();
    expect(abort).toHaveBeenCalled();
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

  it("speak reports word boundaries and the end", () => {
    const spoken = vi.fn();
    vi.stubGlobal("SpeechSynthesisUtterance", function (this: { text: string }, text: string) {
      this.text = text;
    });
    vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), speak: spoken });
    const onWord = vi.fn();
    const onEnd = vi.fn();
    speak("bonjour madame", 1, { onWord, onEnd });
    const utterance = spoken.mock.calls[0][0];
    utterance.onboundary({ name: "word", charIndex: 8 });
    utterance.onboundary({ name: "sentence", charIndex: 0 });
    utterance.onend();
    expect(onWord).toHaveBeenCalledTimes(1);
    expect(onWord).toHaveBeenCalledWith(8);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});

describe("speak voice and start", () => {
  it("prefers a local French voice and reports when the voice starts", () => {
    const spoken = vi.fn();
    vi.stubGlobal("SpeechSynthesisUtterance", function (this: { text: string }, text: string) {
      this.text = text;
    });
    const local = { lang: "fr-FR", localService: true, name: "Hortense" };
    const remote = { lang: "fr-FR", localService: false, name: "Google français" };
    vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), speak: spoken, getVoices: () => [remote, local] });
    const onStart = vi.fn();
    speak("bonjour", 1, { onStart });
    const utterance = spoken.mock.calls[0][0];
    expect(utterance.voice).toBe(local);
    utterance.onstart();
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
