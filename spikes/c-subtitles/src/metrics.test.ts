import { describe, expect, it } from "vitest";
import { createDetectionCounter, createLatencyTracker } from "./metrics";

describe("latency tracker", () => {
  it("returns nulls before any speech start", () => {
    const t = createLatencyTracker();
    expect(t.markResult(100, false)).toEqual({ firstTextMs: null, finalMs: null });
    expect(t.medianFirstTextMs()).toBeNull();
  });

  it("measures first text once and final time from speech start", () => {
    const t = createLatencyTracker();
    t.markSpeechStart(1000);
    expect(t.markResult(1300, false)).toEqual({ firstTextMs: 300, finalMs: null });
    expect(t.markResult(1500, false)).toEqual({ firstTextMs: null, finalMs: null });
    expect(t.markResult(1900, true)).toEqual({ firstTextMs: null, finalMs: 900 });
  });

  it("reports both when the first result is final", () => {
    const t = createLatencyTracker();
    t.markSpeechStart(0);
    expect(t.markResult(400, true)).toEqual({ firstTextMs: 400, finalMs: 400 });
  });

  it("uses the previous final as start when no new start arrives", () => {
    const t = createLatencyTracker();
    t.markSpeechStart(0);
    t.markResult(400, true);
    expect(t.markResult(650, false)).toEqual({ firstTextMs: 250, finalMs: null });
    expect(t.markResult(900, true)).toEqual({ firstTextMs: null, finalMs: 500 });
  });

  it("computes the median of first-text latencies", () => {
    const t = createLatencyTracker();
    for (const ms of [100, 300, 200]) {
      t.markSpeechStart(0);
      t.markResult(ms, false);
      t.markResult(ms + 1, true);
    }
    expect(t.medianFirstTextMs()).toBe(200);
  });

  it("keeps only the last 20 values", () => {
    const t = createLatencyTracker();
    for (let i = 0; i < 25; i++) {
      t.markSpeechStart(0);
      t.markResult(i < 5 ? 10000 : 100, true);
    }
    expect(t.medianFirstTextMs()).toBe(100);
  });
});

describe("detection counter", () => {
  const lemmas = ["a", "b", "c"];

  it("starts at 0/N", () => {
    expect(createDetectionCounter(lemmas).label()).toBe("0/3");
  });

  it("ignores unknown lemmas and duplicates", () => {
    const c = createDetectionCounter(lemmas);
    c.add(["a", "a", "zzz"]);
    c.add(["a", "b"]);
    expect(c.label()).toBe("2/3");
    expect([...c.detected()].sort()).toEqual(["a", "b"]);
  });
});
