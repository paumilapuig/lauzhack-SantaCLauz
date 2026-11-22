"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import type { LessonSummary } from "./teacher-contract";
import { teacherApi } from "./teacher-api-client";
import { moveLessonErrorFr } from "./teacher-errors";

/** Move one of her lessons that is in no course into this course. */
export function AddExistingLesson({ courseId, lessons, onAdded }: { courseId: string; lessons: LessonSummary[]; onAdded: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (lessons.length === 0) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lessonId = String(new FormData(event.currentTarget).get("lesson_id"));
    setError(null);
    setPending(true);
    try {
      await teacherApi.moveLesson(lessonId, courseId);
      onAdded();
    } catch (err) {
      setError(moveLessonErrorFr(err instanceof ApiError ? err.status : 0));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-[20px] bg-fill p-4">
      <label htmlFor="lesson_id" className="text-[14px] font-bold text-heading">Add a lesson you already have</label>
      <div className="flex flex-wrap gap-2">
        <select
          id="lesson_id"
          name="lesson_id"
          lang="fr"
          className="h-11 min-w-0 flex-1 rounded-[12px] border border-input bg-card px-3 text-[15px] text-heading outline-none focus-visible:border-heading focus-visible:ring-2 focus-visible:ring-heading/15"
        >
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full border border-border bg-card px-5 text-[15px] font-bold text-heading hover:bg-input-hover/20 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Add
        </button>
      </div>
      {error ? <p role="alert" className="text-[15px] text-destructive">{error}</p> : null}
    </form>
  );
}
