export type MicLevel = "quiet" | "good" | "loud";

const QUIET_BELOW = 0.02;
const LOUD_ABOVE = 0.35;
const SMOOTHING = 0.2;

/** Root mean square of one window of samples (0 = silence, ~1 = full scale). */
export function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.sqrt(sum / samples.length);
}

/** Exponential moving average so the indicator changes calmly. */
export function smoothLevel(previous: number, next: number): number {
  return previous + SMOOTHING * (next - previous);
}

export function classifyLevel(level: number): MicLevel {
  if (level < QUIET_BELOW) return "quiet";
  return level > LOUD_ABOVE ? "loud" : "good";
}
