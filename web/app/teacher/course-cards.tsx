import { ArrowRight, FolderOpen } from "lucide-react";
import Link from "next/link";
import { lessonCount, lessonsInCourse } from "./courses";
import type { Course, LessonSummary } from "./teacher-contract";

const CARD = "flex min-h-52 flex-col gap-4 rounded-[24px] border border-border bg-card p-5 md:p-6";

function CourseCard({ course, lessons, index }: { course: Course; lessons: LessonSummary[]; index: number }) {
  const latest = lessonsInCourse(lessons, course.id).slice(0, 2);
  return (
    <li style={{ "--i": index } as React.CSSProperties} className="animate-rise">
      <Link
        href={`/teacher/courses/${course.id}`}
        className={`group ${CARD} h-full transition-[border-color,transform] hover:border-input-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
      >
        <span aria-hidden className="flex size-10 items-center justify-center rounded-[12px] bg-brand-orange-soft text-brand-orange">
          <FolderOpen className="size-5" strokeWidth={2} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span lang="fr" className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-heading">{course.name}</span>
          <span className="text-[14px] text-label-secondary">{lessonCount(course.lesson_count)}</span>
        </span>
        {latest.length > 0 && (
          <span className="flex flex-col gap-1 border-t border-separator pt-3">
            {latest.map((lesson) => (
              <span key={lesson.id} lang="fr" className="truncate text-[14px] text-heading">{lesson.title}</span>
            ))}
          </span>
        )}
        <span className="mt-auto inline-flex items-center gap-1.5 text-[14px] font-bold text-heading">
          Open course
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </li>
  );
}

/** Her courses as cards; the last slot is for creating a new one. */
export function CourseCards({ courses, lessons, newCourse }: { courses: Course[]; lessons: LessonSummary[]; newCourse: React.ReactNode }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course, i) => (
        <CourseCard key={course.id} course={course} lessons={lessons} index={i} />
      ))}
      <li style={{ "--i": courses.length } as React.CSSProperties} className="animate-rise">{newCourse}</li>
    </ul>
  );
}
