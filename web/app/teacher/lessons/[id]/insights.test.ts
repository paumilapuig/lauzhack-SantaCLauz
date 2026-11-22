import { describe, expect, it } from "vitest";
import type { StudentAutonomy, TeacherDashboard } from "../../teacher-contract";
import { insights } from "./insights";

const student = (name: string, values: number[]): StudentAutonomy => ({
  name,
  autonomy: values[values.length - 1] ?? null,
  weekly: values.map((autonomy, i) => ({ week: `W${44 + i}`, autonomy })),
});

const base: TeacherDashboard = {
  lesson: { id: "l1", title: "Cellule" },
  lost_peaks: [],
  concept_gaps: [],
  top_words: [],
  students: [],
};

describe("insights", () => {
  it("returns the three sentences for a full dashboard", () => {
    const data: TeacherDashboard = {
      ...base,
      students: [student("Lucía", [0.5, 0.8])],
      lost_peaks: [
        { minute: 12, count: 5 },
        { minute: 3, count: 2 },
      ],
      top_words: [{ lemma: "mitochondrie", taps: 4 }],
    };
    expect(insights(data)).toEqual([
      "Lucía : autonomie 50 % → 80 % en 2 semaines.",
      "Minute 12 : 5 signalements « je me suis perdu ».",
      "« mitochondrie » a été marqué 4 fois.",
    ]);
  });

  it("caps at 3 with students first", () => {
    const students = ["A", "B", "C", "D"].map((n) => student(n, [0.1, 0.2]));
    const result = insights({
      ...base,
      students,
      lost_peaks: [{ minute: 1, count: 3 }],
    });
    expect(result).toHaveLength(3);
    expect(result.every((s) => s.includes("autonomie"))).toBe(true);
  });

  it("picks the earliest minute on a tie", () => {
    const result = insights({
      ...base,
      lost_peaks: [
        { minute: 12, count: 4 },
        { minute: 3, count: 4 },
      ],
    });
    expect(result).toEqual(["Minute 3 : 4 signalements « je me suis perdu »."]);
  });

  it("adds the concept when a gap covers the peak minute", () => {
    const result = insights({
      ...base,
      lost_peaks: [{ minute: 12, count: 3 }],
      concept_gaps: [
        {
          student: "Lucía",
          concept: "Comment la cellule fabrique de l'énergie",
          minutes: [12],
          lemmas: [],
          status: "pending",
          attempts: 0,
        },
      ],
    });
    expect(result).toEqual([
      "Minute 12 : 3 signalements « je me suis perdu » — probablement « Comment la cellule fabrique de l'énergie ».",
    ]);
  });

  it("skips weak signals and single-week students", () => {
    expect(
      insights({
        ...base,
        students: [student("Lucía", [0.5])],
        lost_peaks: [{ minute: 3, count: 1 }],
        top_words: [{ lemma: "x", taps: 2 }],
      }),
    ).toEqual([]);
  });

  it("returns [] for empty data and never says élèves", () => {
    expect(insights(base)).toEqual([]);
  });
});
