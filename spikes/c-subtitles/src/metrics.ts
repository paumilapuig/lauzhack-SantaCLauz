const MEDIAN_WINDOW = 20;

export interface LatencyResult {
  firstTextMs: number | null;
  finalMs: number | null;
}

export function createLatencyTracker() {
  let startAt: number | null = null;
  let firstTextPending = false;
  const firstTextSamples: number[] = [];

  function recordFirstText(ms: number): void {
    firstTextSamples.push(ms);
    if (firstTextSamples.length > MEDIAN_WINDOW) firstTextSamples.shift();
  }

  return {
    markSpeechStart(at: number): void {
      startAt = at;
      firstTextPending = true;
    },

    markResult(at: number, isFinal: boolean): LatencyResult {
      if (startAt === null) return { firstTextMs: null, finalMs: null };
      const start = startAt;
      let firstTextMs: number | null = null;
      if (firstTextPending) {
        firstTextMs = at - start;
        recordFirstText(firstTextMs);
        firstTextPending = false;
      }
      if (!isFinal) return { firstTextMs, finalMs: null };
      startAt = at;
      firstTextPending = true;
      return { firstTextMs, finalMs: at - start };
    },

    medianFirstTextMs(): number | null {
      if (firstTextSamples.length === 0) return null;
      const sorted = [...firstTextSamples].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    },
  };
}

export function createDetectionCounter(lemmas: string[]) {
  const known = new Set(lemmas);
  const found = new Set<string>();

  return {
    add(detectedLemmas: string[]): void {
      for (const lemma of detectedLemmas) if (known.has(lemma)) found.add(lemma);
    },
    detected: (): Set<string> => new Set(found),
    label: (): string => `${found.size}/${known.size}`,
  };
}
