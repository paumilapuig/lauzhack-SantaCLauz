import { describe, expect, it } from "vitest";
import type { ConceptGapRow } from "../../teacher-contract";
import { classTimeline, hardestMinutes } from "./timeline";

const gap = (concept: string, minutes: number[]): ConceptGapRow => ({ student: "Lucía", concept, minutes, lemmas: [], status: "review", attempts: 1 });

describe("classTimeline", () => {
  it("one column per minute from 0, with both kinds of signal and the ideas lost there", () => {
    const columns = classTimeline(
      [{ minute: 3, count: 2 }],
      [{ minute: 3, count: 1 }, { minute: 1, count: 1 }],
      [gap("La chaleur", [3]), gap("La chaleur", [3])],
      4,
    );
    expect(columns).toEqual([
      { minute: 0, lost: 0, unclear: 0, concepts: [] },
      { minute: 1, lost: 0, unclear: 1, concepts: [] },
      { minute: 2, lost: 0, unclear: 0, concepts: [] },
      { minute: 3, lost: 2, unclear: 1, concepts: ["La chaleur"] },
    ]);
  });

  it("runs to the last minute with a signal when the lesson is longer than the minimum", () => {
    expect(classTimeline([{ minute: 20, count: 1 }], [], [], 15)).toHaveLength(21);
  });
});

describe("hardestMinutes", () => {
  it("the minutes with the most signals, most first, ties by earlier minute; quiet minutes never", () => {
    const columns = classTimeline([{ minute: 12, count: 6 }, { minute: 3, count: 2 }], [{ minute: 4, count: 2 }], [], 15);
    expect(hardestMinutes(columns, 2).map((c) => c.minute)).toEqual([12, 3]);
    expect(hardestMinutes(classTimeline([], [], [], 5), 2)).toEqual([]);
  });
});
