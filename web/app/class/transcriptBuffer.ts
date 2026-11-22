import { isRevisionOf } from "./finalRevision";

export type TranscriptBufferOptions = { keepSec: number };

export type TranscriptBuffer = {
  add(text: string, tSec: number): void;
  textBetween(tStart: number, tEnd: number): string;
  prune(nowSec: number): void;
};

type Entry = { text: string; tSec: number };

export function createTranscriptBuffer({ keepSec }: TranscriptBufferOptions): TranscriptBuffer {
  let entries: Entry[] = [];

  return {
    add(text, tSec) {
      const last = entries.at(-1);
      if (last && isRevisionOf(last.text, text)) last.text = text;
      else entries.push({ text, tSec });
    },
    textBetween(tStart, tEnd) {
      return entries
        .filter((entry) => entry.tSec >= tStart && entry.tSec <= tEnd)
        .map((entry) => entry.text)
        .join(" ");
    },
    prune(nowSec) {
      entries = entries.filter((entry) => entry.tSec >= nowSec - keepSec);
    },
  };
}
