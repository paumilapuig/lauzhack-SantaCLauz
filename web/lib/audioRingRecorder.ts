export interface RecorderLike {
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null;
  start(timesliceMs?: number): void;
  stop(): void;
  requestData(): void;
}

export type RecorderConstructor = new (stream: MediaStream) => RecorderLike;

export interface AudioClip {
  blob: Blob;
  tStart: number;
  tEnd: number;
}

interface AudioRingRecorderOptions {
  stream: MediaStream;
  Recorder?: RecorderConstructor;
  now: () => number;
  windowSec?: number;
  stepSec?: number;
  minClipSec?: number;
}

interface Slot {
  recorder: RecorderLike;
  startedAt: number;
  chunks: Blob[];
}

const TIMESLICE_MS = 1000;

export function createAudioRingRecorder(options: AudioRingRecorderOptions) {
  const { stream, now, windowSec = 15, stepSec = 5, minClipSec = 10 } = options;
  const Recorder = options.Recorder ?? (MediaRecorder as unknown as RecorderConstructor);
  let slots: Slot[] = [];
  let timer: ReturnType<typeof setInterval> | undefined;

  function spawn() {
    const recorder = new Recorder(stream);
    const slot: Slot = { recorder, startedAt: now(), chunks: [] };
    recorder.ondataavailable = (event) => slot.chunks.push(event.data);
    recorder.start(TIMESLICE_MS);
    slots.push(slot);
  }

  function release(slot: Slot) {
    slot.recorder.ondataavailable = null;
    slot.recorder.stop();
  }

  function dropExpired() {
    const expired = slots.filter((s) => now() - s.startedAt >= windowSec);
    expired.forEach(release);
    slots = slots.filter((s) => !expired.includes(s));
  }

  function tick() {
    spawn();
    dropExpired();
  }

  function start() {
    if (timer !== undefined) return;
    spawn();
    timer = setInterval(tick, stepSec * 1000);
  }

  function stop() {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
    slots.forEach(release);
    slots = [];
  }

  function flush(slot: Slot): Promise<void> {
    return new Promise((resolve) => {
      const collect = slot.recorder.ondataavailable;
      slot.recorder.ondataavailable = (event) => {
        collect?.(event);
        slot.recorder.ondataavailable = collect;
        resolve();
      };
      slot.recorder.requestData();
    });
  }

  function pickSlot(): Slot | undefined {
    return slots.find((s) => now() - s.startedAt >= minClipSec) ?? slots[0];
  }

  async function clip(): Promise<AudioClip> {
    const tEnd = now();
    dropExpired();
    const slot = pickSlot();
    if (!slot) throw new Error("Recorder is not running");
    // Claim the slot first so the expiry timer cannot stop it while we wait for its last chunk.
    slots = slots.filter((s) => s !== slot);
    await flush(slot);
    release(slot);
    const type = slot.recorder.mimeType || "audio/webm";
    // The press time is the clip end; the reported window never exceeds windowSec (API limit for word clips).
    return { blob: new Blob(slot.chunks, { type }), tStart: Math.max(slot.startedAt, tEnd - windowSec), tEnd };
  }

  return { start, stop, clip };
}
