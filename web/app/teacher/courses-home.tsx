"use client";

import { CourseCards } from "./course-cards";
import { lessonsWithoutCourse } from "./courses";
import { LessonList } from "./lesson-list";
import { NewCourseForm } from "./new-course-form";
import { useTeacherData } from "./use-teacher-data";

/** /teacher: her courses, a card to create one, and the lessons that are in no course yet. */
export function CoursesHome() {
  const { data } = useTeacherData();

  if (data.kind === "loading") return <p className="text-[16px] text-label-secondary">Loading…</p>;
  if (data.kind === "error") return <p role="alert" className="text-[16px] text-destructive">{data.message}</p>;

  const loose = lessonsWithoutCourse(data.lessons);
  return (
    <div className="flex flex-col gap-10">
      <CourseCards courses={data.courses} lessons={data.lessons} newCourse={<NewCourseForm />} />
      {loose.length > 0 && (
        <section aria-labelledby="loose-lessons" className="flex max-w-[720px] flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="loose-lessons" className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">Not in a course</h2>
            <p className="text-[15px] text-label-secondary">Open a course and use «Add a lesson you already have» to move them there.</p>
          </div>
          <LessonList lessons={loose} empty="" />
        </section>
      )}
    </div>
  );
}
