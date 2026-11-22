import type { WordToPractice } from "@/lib/student-contract";

/** clip id → marked surface word (lowercase) → Spanish translation ("" when the API has none). */
export type ClipMarks = Record<string, Record<string, string>>;

export function marksFrom(words: WordToPractice[]): ClipMarks {
  const marks: ClipMarks = {};
  for (const { word, clip_id, translation_es } of words) {
    if (clip_id) (marks[clip_id] ??= {})[word.toLowerCase()] = translation_es ?? "";
  }
  return marks;
}

export function withMark(marks: ClipMarks, clipId: string, word: string, translation: string): ClipMarks {
  return { ...marks, [clipId]: { ...marks[clipId], [word.toLowerCase()]: translation } };
}

export function withoutMark(marks: ClipMarks, clipId: string, word: string): ClipMarks {
  const rest = { ...marks[clipId] };
  delete rest[word.toLowerCase()];
  return { ...marks, [clipId]: rest };
}
