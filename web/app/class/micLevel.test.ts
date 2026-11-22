import { describe, expect, it } from "vitest";
import { classifyLevel, rms, smoothLevel } from "./micLevel";

describe("mic level", () => {
  it("measures the loudness of a sample window", () => {
    expect(rms(new Float32Array([0, 0, 0, 0]))).toBe(0);
    expect(rms(new Float32Array([0.5, -0.5, 0.5, -0.5]))).toBeCloseTo(0.5);
  });

  it("smooths so the indicator does not flicker", () => {
    expect(smoothLevel(0, 1)).toBeCloseTo(0.2);
    expect(smoothLevel(0.5, 0.5)).toBeCloseTo(0.5);
  });

  it("says quiet, good or loud", () => {
    expect(classifyLevel(0.005)).toBe("quiet");
    expect(classifyLevel(0.08)).toBe("good");
    expect(classifyLevel(0.5)).toBe("loud");
  });
});
