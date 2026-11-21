type RecognitionResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };

type Recognition = {
  lang: string;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type RecognitionConstructor = new () => Recognition;

export function speak(text: string, rate: number): void {
  if (!globalThis.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = rate;
  globalThis.speechSynthesis.cancel();
  globalThis.speechSynthesis.speak(utterance);
}

export function listenOnce(lang: string): Promise<string | null> {
  const w = typeof window === "undefined" ? undefined : (window as unknown as Record<string, unknown>);
  const Ctor = (w?.SpeechRecognition ?? w?.webkitSpeechRecognition) as RecognitionConstructor | undefined;
  if (!Ctor) return Promise.resolve(null);

  return new Promise((resolve) => {
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.onresult = (event) => resolve(event.results[0]?.[0]?.transcript ?? null);
    recognition.onerror = () => resolve(null);
    recognition.onend = () => resolve(null); // no-op if onresult already resolved
    try {
      recognition.start();
    } catch {
      resolve(null);
    }
  });
}
