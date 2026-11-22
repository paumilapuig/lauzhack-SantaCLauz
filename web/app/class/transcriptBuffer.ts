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

// Each word remembers when it was first heard: between `from` (the previous update) and `to` (the update that brought it).
// Chrome may keep one long unpunctuated sentence for a whole minute, so a clip keeps only the words heard during it.
type Word = { text: string; from: number; to: number };
// start = when the sentence was first heard, end = when it was last updated
type Entry = { words: Word[]; start: number; end: number };

const textOf = (words: Word[]) => words.map((word) => word.text).join(" ");

/** The sentence's new wording; words it already had keep their time, new ones were heard in (since, tSec]. */
function grow(words: Word[], text: string, tSec: number, since: number): Word[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((piece, i) => (words[i] ? { ...words[i], text: piece } : { text: piece, from: since, to: tSec }));
}

export function createTranscriptBuffer({ keepSec }: TranscriptBufferOptions): TranscriptBuffer {
  let entries: Entry[] = [];
  let heard: Entry | null = null;

  return {
    add(text, tSec) {
      const last = entries.at(-1);
      if (last && isRevisionOf(textOf(last.words), text)) {
        last.words = grow(last.words, text, tSec, last.end);
        last.end = tSec;
      } else entries.push({ words: grow(heard?.words ?? [], text, tSec, heard?.end ?? tSec), start: heard?.start ?? tSec, end: tSec });
      heard = null;
    },
    hear(text, tSec) {
      if (!text.trim()) heard = null;
      else heard = { words: grow(heard?.words ?? [], text, tSec, heard?.end ?? tSec), start: heard?.start ?? tSec, end: tSec };
    },
    textBetween(tStart, tEnd) {
      return [...entries, ...(heard ? [heard] : [])]
        .map((entry) => textOf(entry.words.filter((word) => word.to >= tStart && word.from <= tEnd)))
        .filter(Boolean)
        .join(" ");
    },
    prune(nowSec) {
      entries = entries.filter((entry) => entry.end >= nowSec - keepSec);
    },
  };
}
