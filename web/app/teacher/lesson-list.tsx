import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { LessonSummary } from "./teacher-contract";

const formatDate = (isoDate: string): string =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** Lesson cards, each opening its dashboard. */
export function LessonList({ lessons, empty }: { lessons: LessonSummary[]; empty: string }) {
  if (lessons.length === 0) return <p className="text-[16px] text-label-secondary">{empty}</p>;

  return (
    <ul className="flex flex-col gap-3">
      {lessons.map((lesson, i) => (
        <li key={lesson.id} style={{ "--i": i } as React.CSSProperties} className="animate-rise">
          <Link
            href={`/teacher/lessons/${lesson.id}`}
            className="group flex items-center justify-between gap-4 rounded-[20px] border border-border bg-card px-5 py-4 transition-[border-color,transform] hover:border-input-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span lang="fr" className="truncate text-[18px] font-bold text-heading">{lesson.title}</span>
              <span className="text-[14px] text-label-secondary">
                {lesson.subject} · {formatDate(lesson.lesson_date)}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-bold text-heading">
              Dashboard
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
