type RecognitionResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };

type Recognition = {
  lang: string;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

type RecognitionConstructor = new () => Recognition;

export type SpeakHandlers = {
  /** charIndex (in `text`) of each word as the voice reaches it; not every voice reports it */
  onWord?: (charIndex: number) => void;
  onEnd?: () => void;
  /** the voice actually started (network voices start late) */
  onStart?: () => void;
};

export function speak(text: string, rate: number, handlers: SpeakHandlers = {}): void {
  if (!globalThis.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = rate;
  // local voices report word boundaries; network ones (e.g. "Google français") do not
  const french = globalThis.speechSynthesis.getVoices?.().filter((v) => v.lang?.toLowerCase().startsWith("fr")) ?? [];
  const voice = french.find((v) => v.localService) ?? french[0];
  if (voice) utterance.voice = voice;
  utterance.onstart = () => handlers.onStart?.();
  utterance.onboundary = (event) => {
    if (event.name === "word") handlers.onWord?.(event.charIndex);
  };
  utterance.onend = () => handlers.onEnd?.();
  globalThis.speechSynthesis.cancel();
  globalThis.speechSynthesis.speak(utterance);
}

export type Listening = { result: Promise<string | null>; abort: () => void };

export function listenOnce(lang: string): Listening {
  const w = typeof window === "undefined" ? undefined : (window as unknown as Record<string, unknown>);
  const Ctor = (w?.SpeechRecognition ?? w?.webkitSpeechRecognition) as RecognitionConstructor | undefined;
  if (!Ctor) return { result: Promise.resolve(null), abort: () => {} };

  const recognition = new Ctor();
  const result = new Promise<string | null>((resolve) => {
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
  return { result, abort: () => recognition.abort() };
}
