import type { ConceptGapRow, LostPeak } from "../../teacher-contract";

export type MinuteColumn = { minute: number; lost: number; unclear: number; concepts: string[] };

const countAt = (peaks: LostPeak[], minute: number) => peaks.find((p) => p.minute === minute)?.count ?? 0;

/** The lesson minute by minute: "lost the thread" reports, "didn't understand" clips and the ideas lost there. */
export function classTimeline(lost: LostPeak[], unclear: LostPeak[], gaps: ConceptGapRow[], minMinutes = 15): MinuteColumn[] {
  const last = Math.max(minMinutes - 1, ...lost.map((p) => p.minute), ...unclear.map((p) => p.minute));
  return Array.from({ length: last + 1 }, (_, minute) => ({
    minute,
    lost: countAt(lost, minute),
    unclear: countAt(unclear, minute),
    concepts: [...new Set(gaps.filter((g) => g.minutes.includes(minute)).map((g) => g.concept))],
  }));
}

export const signals = (column: MinuteColumn) => column.lost + column.unclear;

/** The minutes to talk about in the next class: most signals first, ties by earlier minute. */
export function hardestMinutes(columns: MinuteColumn[], count: number): MinuteColumn[] {
  return columns
    .filter((c) => signals(c) > 0)
    .sort((a, b) => signals(b) - signals(a) || a.minute - b.minute)
    .slice(0, count);
}
