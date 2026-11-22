import type { LessonSummary } from "./teacher-contract";

export const lessonsInCourse = (lessons: LessonSummary[], courseId: string): LessonSummary[] =>
  lessons.filter((lesson) => lesson.course_id === courseId);

export const lessonsWithoutCourse = (lessons: LessonSummary[]): LessonSummary[] =>
  lessons.filter((lesson) => !lesson.course_id);

export const lessonCount = (count: number): string =>
  count === 0 ? "No lessons yet" : `${count} ${count === 1 ? "lesson" : "lessons"}`;
