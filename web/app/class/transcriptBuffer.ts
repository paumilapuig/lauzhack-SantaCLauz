import { isRevisionOf } from "./finalRevision";

export type TranscriptBufferOptions = { keepSec: number };

export type TranscriptBuffer = {
  /** a final sentence from the recognizer */
  add(text: string, tSec: number): void;
  /** the sentence still being heard (interim result); "" when there is none */
  hear(text: string, tSec: number): void;
  /** text of every sentence that overlaps [tStart, tEnd], plus the one still being heard */
  textBetween(tStart: number, tEnd: number): string;
  prune(nowSec: number): void;
};

// start = when the sentence was first heard, end = when it was last updated
type Entry = { text: string; start: number; end: number };

export function createTranscriptBuffer({ keepSec }: TranscriptBufferOptions): TranscriptBuffer {
  let entries: Entry[] = [];
  let heard: Entry | null = null;

  return {
    add(text, tSec) {
      const start = heard?.start ?? tSec;
      heard = null;
      const last = entries.at(-1);
      if (last && isRevisionOf(last.text, text)) {
        last.text = text;
        last.end = tSec;
      } else entries.push({ text, start, end: tSec });
    },
    hear(text, tSec) {
      if (!text.trim()) heard = null;
      else heard = { text: text.trim(), start: heard?.start ?? tSec, end: tSec };
    },
    textBetween(tStart, tEnd) {
      const overlapping = entries.filter((entry) => entry.end >= tStart && entry.start <= tEnd).map((entry) => entry.text);
      if (heard && heard.start <= tEnd) overlapping.push(heard.text);
      return overlapping.join(" ");
    },
    prune(nowSec) {
      entries = entries.filter((entry) => entry.end >= nowSec - keepSec);
    },
  };
}
