"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AddExistingLesson } from "../../add-existing-lesson";
import { lessonCount, lessonsInCourse, lessonsWithoutCourse } from "../../courses";
import { CreateLessonForm } from "../../create-lesson-form";
import { LessonList } from "../../lesson-list";
import { useTeacherData } from "../../use-teacher-data";

const BackLink = () => (
  <Link href="/teacher" className="inline-flex w-fit items-center gap-1.5 rounded-full text-[15px] font-medium text-label-secondary hover:text-heading">
    <ArrowLeft aria-hidden className="size-4" /> My courses
  </Link>
);

/** One course: its lessons, a way to add an existing lesson, and the form for a new one. */
export function CourseView({ courseId }: { courseId: string }) {
  const { data, reload } = useTeacherData();

  if (data.kind === "loading") return <p className="text-[16px] text-label-secondary">Loading…</p>;
  if (data.kind === "error") return <p role="alert" className="text-[16px] text-destructive">{data.message}</p>;

  const course = data.courses.find((c) => c.id === courseId);
  if (!course) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <p role="alert" className="text-[16px] text-label-secondary">Course not found.</p>
      </div>
    );
  }

  const lessons = lessonsInCourse(data.lessons, course.id);
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <BackLink />
        <p className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">Course</p>
        <h1 lang="fr" className="text-[34px] leading-tight font-bold tracking-[-0.02em] text-heading md:text-[44px]">{course.name}</h1>
        <p className="text-[16px] text-label-secondary">{lessonCount(lessons.length)}</p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section aria-labelledby="lessons" className="flex flex-col gap-4">
          <h2 id="lessons" className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">Lessons</h2>
          <LessonList lessons={lessons} empty="No lessons in this course yet. Create the first one." />
          <AddExistingLesson courseId={course.id} lessons={lessonsWithoutCourse(data.lessons)} onAdded={reload} />
        </section>
        <section aria-labelledby="new-lesson" className="flex flex-col gap-5 rounded-[24px] border border-border bg-card p-5 md:p-7">
          <h2 id="new-lesson" className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-heading">New lesson</h2>
          <CreateLessonForm courseId={course.id} defaultSubject={course.name} />
        </section>
      </div>
    </div>
  );
}
