import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRecognizer } from "./recognizer";

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = "";
  continuous = false;
  interimResults = false;
  startCalls = 0;
  failNextStarts = 0;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onspeechstart: (() => void) | null = null;
  onresult: ((e: unknown) => void) | null = null;
  constructor() {
    FakeRecognition.instances.push(this);
  }
  start() {
    this.startCalls++;
    if (this.failNextStarts > 0) {
      this.failNextStarts--;
      throw new DOMException("already started", "InvalidStateError");
    }
    this.onstart?.();
  }
  stop() {
    this.onend?.();
  }
}

function fakeResults(parts: Array<[string, boolean]>) {
  return parts.map(([transcript, isFinal]) => Object.assign([{ transcript }], { isFinal }));
}

function setup() {
  FakeRecognition.instances = [];
  const onResult = vi.fn();
  const onSpeechStart = vi.fn();
  const onStatus = vi.fn();
  const recognizer = createRecognizer({
    Ctor: FakeRecognition as never,
    onResult,
    onSpeechStart,
    onStatus,
    now: () => 42,
  });
  recognizer.start();
  return { recognizer, fake: FakeRecognition.instances[0], onResult, onSpeechStart, onStatus };
}

describe("createRecognizer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("configures French continuous interim recognition and reports listening", () => {
    const { fake, onStatus } = setup();
    expect([fake.lang, fake.continuous, fake.interimResults]).toEqual(["fr-FR", true, true]);
    expect(onStatus).toHaveBeenLastCalledWith("listening");
  });

  it("splits final and interim text from resultIndex", () => {
    const { fake, onResult } = setup();
    const results = fakeResults([["ignored ", true], ["bonjour ", true], ["la classe", false]]);
    fake.onresult?.({ resultIndex: 1, results });
    expect(onResult).toHaveBeenCalledWith({ finalText: "bonjour ", interimText: "la classe", at: 42 });
  });

  it("forwards speechstart with the timestamp", () => {
    const { fake, onSpeechStart } = setup();
    fake.onspeechstart?.();
    expect(onSpeechStart).toHaveBeenCalledWith(42);
  });

  it("ignores speechstart when no onSpeechStart handler is given", () => {
    FakeRecognition.instances = [];
    createRecognizer({ Ctor: FakeRecognition as never, onResult: vi.fn(), onStatus: vi.fn() }).start();
    expect(() => FakeRecognition.instances[0].onspeechstart?.()).not.toThrow();
  });

  it("restarts after an unexpected end", () => {
    const { fake, onStatus } = setup();
    fake.onend?.();
    expect(fake.startCalls).toBe(2);
    expect(onStatus).toHaveBeenCalledWith("restarting");
  });

  it("retries after 250 ms when restart throws InvalidStateError", () => {
    const { fake } = setup();
    fake.failNextStarts = 1;
    fake.onend?.();
    expect(fake.startCalls).toBe(2);
    vi.advanceTimersByTime(250);
    expect(fake.startCalls).toBe(3);
  });

  it("does not restart after stop()", () => {
    const { recognizer, fake, onStatus } = setup();
    recognizer.stop();
    expect(fake.startCalls).toBe(1);
    expect(onStatus).toHaveBeenLastCalledWith("stopped");
  });

  it.each(["not-allowed", "service-not-allowed"])("reports error and does not restart on %s", (code) => {
    const { fake, onStatus } = setup();
    fake.onerror?.({ error: code });
    fake.onend?.();
    expect(fake.startCalls).toBe(1);
    expect(onStatus).toHaveBeenLastCalledWith("error", code);
  });

  it.each(["no-speech", "aborted", "network"])("lets onend restart after %s", (code) => {
    const { fake } = setup();
    fake.onerror?.({ error: code });
    fake.onend?.();
    expect(fake.startCalls).toBe(2);
  });
});
