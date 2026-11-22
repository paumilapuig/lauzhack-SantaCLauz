import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LessonSummary } from "@/lib/contract";
import { StudentPage } from "@/components/student-page";
import { Button } from "@/components/ui/button";

function lessonMeta(lesson: LessonSummary): string {
  return [lesson.subject, lesson.lesson_date].filter(Boolean).join(" · ");
}

/** Student start page: pick today's lesson to open /class with it. */
export function StudentHub({ email, lessons, status }: { email: string; lessons: LessonSummary[]; status?: ReactNode }) {
  return (
    <StudentPage title="Today" lead="Pick the class that is starting now. Subtitles and buttons open on the class screen.">
      <section aria-labelledby="lessons" className="flex flex-col gap-4">
        <h2 id="lessons" className="text-[20px] font-medium tracking-[-0.5px]">
          Classes
        </h2>
        {lessons.length === 0 ? (
          <p className="text-label-secondary">No classes yet. Ask your teacher to prepare one.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-border bg-card p-5"
              >
                <div className="flex flex-col gap-1">
                  <p lang="fr" className="text-[18px] font-bold tracking-[-0.3px]">
                    {lesson.title}
                  </p>
                  {lessonMeta(lesson) && <p className="text-sm text-label-secondary">{lessonMeta(lesson)}</p>}
                </div>
                <Link
                  href={`/class?lesson=${lesson.id}`}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-charcoal px-5 text-[15px] font-bold text-primary-foreground shadow-[var(--shadow-subtle)] transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Start the class
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-separator pt-6 text-sm text-label-secondary">
        <div className="flex flex-col gap-1">
          <p>
            Signed in: <span className="font-medium text-label">{email}</span>
          </p>
          {status}
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </footer>
    </StudentPage>
  );
}
