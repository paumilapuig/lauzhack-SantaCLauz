import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAudioRingRecorder } from "./audioRingRecorder";

class FakeRecorder {
  static instances: FakeRecorder[] = [];
  static nextId = 0;
  id = FakeRecorder.nextId++;
  mimeType = "audio/webm";
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  constructor(public stream: unknown) {
    FakeRecorder.instances.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
  }
  requestData() {
    this.ondataavailable?.({ data: new Blob([`rec${this.id}`]) });
  }
}

let nowMs = 0;
const advance = (sec: number) => {
  for (let i = 0; i < sec; i++) {
    nowMs += 1000;
    vi.advanceTimersByTime(1000);
  }
};
const alive = () => FakeRecorder.instances.filter((r) => r.state === "recording");

function build() {
  return createAudioRingRecorder({
    stream: {} as MediaStream,
    Recorder: FakeRecorder as never,
    now: () => nowMs / 1000,
    windowSec: 15,
    stepSec: 5,
  });
}

describe("createAudioRingRecorder", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    nowMs = 0;
    FakeRecorder.instances = [];
    FakeRecorder.nextId = 0;
  });
  afterEach(() => vi.useRealTimers());

  it.each([12, 27, 31])("clip at t=%i is between 10 s and 15 s long", async (t) => {
    const r = build();
    r.start();
    advance(t);
    const clip = await r.clip();
    const length = clip.tEnd - clip.tStart;
    expect(clip.tEnd).toBe(t);
    expect(length).toBeGreaterThanOrEqual(10);
    expect(length).toBeLessThanOrEqual(15);
  });

  it("clip uses the oldest recorder that is at least 10 s old", async () => {
    const r = build();
    r.start();
    advance(27);
    const clip = await r.clip();
    expect(clip.tStart).toBe(15);
    expect(await clip.blob.text()).toBe("rec3");
  });

  it("warm-up: before 10 s exist, clip uses the oldest recorder with its real times", async () => {
    const r = build();
    r.start();
    advance(3);
    const clip = await r.clip();
    expect([clip.tStart, clip.tEnd]).toEqual([0, 3]);
  });

  it("clip stops the recorder it used", async () => {
    const r = build();
    r.start();
    advance(12);
    await r.clip();
    expect(FakeRecorder.instances[0].state).toBe("inactive");
  });

  it("never keeps more than 3 recorders alive and stops expired ones", () => {
    const r = build();
    r.start();
    for (let i = 0; i < 20; i++) {
      advance(5);
      expect(alive().length).toBeLessThanOrEqual(3);
    }
    expect(FakeRecorder.instances[0].state).toBe("inactive");
  });

  it("stop stops all recorders", () => {
    const r = build();
    r.start();
    advance(20);
    r.stop();
    expect(alive()).toHaveLength(0);
  });
  it("stamps the clip at the press and never reports more than the window, even if the recorder is slow", async () => {
    const r = build();
    r.start();
    advance(14);
    const slow = vi.spyOn(FakeRecorder.prototype, "requestData").mockImplementation(function (this: FakeRecorder) {
      setTimeout(() => this.ondataavailable?.({ data: new Blob(["late"]) }), 8000);
    });
    const pressedAt = nowMs / 1000;
    const pending = r.clip();
    advance(8);
    const clip = await pending;
    slow.mockRestore();
    expect(clip.tEnd).toBe(pressedAt);
    expect(clip.tEnd - clip.tStart).toBeLessThanOrEqual(15);
  });
});
