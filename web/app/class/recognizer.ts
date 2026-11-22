export type RecognizerStatus = "listening" | "restarting" | "stopped" | "offline" | "error";

interface RecognitionResult {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}

interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  start(): void;
  stop(): void;
}

export type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export interface RecognizerOptions {
  Ctor: SpeechRecognitionCtor;
  onResult(r: { finalText: string; interimText: string; at: number }): void;
  onSpeechStart?(at: number): void;
  onStatus(s: RecognizerStatus, detail?: string): void;
  now?: () => number;
}

const RESTART_RETRY_MS = 250;
const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed"]);

function splitResults(event: RecognitionResultEvent) {
  let finalText = "";
  let interimText = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    if (result.isFinal) finalText += result[0].transcript;
    else interimText += result[0].transcript;
  }
  return { finalText, interimText };
}

export function createRecognizer(opts: RecognizerOptions): { start(): void; stop(): void } {
  const now = opts.now ?? Date.now;
  const recognition = new opts.Ctor();
  recognition.lang = "fr-FR";
  recognition.continuous = true;
  recognition.interimResults = true;

  let stoppedByUser = true;
  let failed = false;

  const startOrRetry = () => {
    try {
      recognition.start();
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "InvalidStateError") throw error;
      setTimeout(() => {
        if (!stoppedByUser) startOrRetry();
      }, RESTART_RETRY_MS);
    }
  };

  recognition.onstart = () => opts.onStatus("listening");
  recognition.onspeechstart = () => opts.onSpeechStart?.(now());
  recognition.onresult = (event) => opts.onResult({ ...splitResults(event), at: now() });
  recognition.onerror = (event) => {
    if (event.error === "network") return opts.onStatus("offline"); // Chrome's speech service is unreachable; onend retries
    if (!FATAL_ERRORS.has(event.error)) return;
    failed = true;
    opts.onStatus("error", event.error);
  };
  recognition.onend = () => {
    if (stoppedByUser || failed) return;
    opts.onStatus("restarting");
    startOrRetry();
  };

  return {
    start() {
      stoppedByUser = false;
      failed = false;
      startOrRetry();
    },
    stop() {
      stoppedByUser = true;
      recognition.stop();
      opts.onStatus("stopped");
    },
  };
}
