import { describe, expect, it } from "vitest";
import { lessonCount, lessonsInCourse, lessonsWithoutCourse } from "./courses";
import type { LessonSummary } from "./teacher-contract";

const lesson = (id: string, course_id: string | null): LessonSummary => ({ id, title: id, subject: "SVT", lesson_date: "2026-11-22", course_id });
const LESSONS = [lesson("a", "bio"), lesson("b", null), lesson("c", "bio"), lesson("d", "chimie")];

describe("courses", () => {
  it("keeps the lessons of one course, in the list order", () => {
    expect(lessonsInCourse(LESSONS, "bio").map((l) => l.id)).toEqual(["a", "c"]);
  });

  it("keeps the lessons that are in no course", () => {
    expect(lessonsWithoutCourse(LESSONS).map((l) => l.id)).toEqual(["b"]);
  });

  it("counts lessons in words", () => {
    expect(lessonCount(0)).toBe("No lessons yet");
    expect(lessonCount(1)).toBe("1 lesson");
    expect(lessonCount(4)).toBe("4 lessons");
  });
});
