"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { LessonSummary } from "./teacher-contract";
import { teacherApi } from "./teacher-api-client";
import { loadErrorFr } from "./teacher-errors";

type ListState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; lessons: LessonSummary[] };

const formatDate = (isoDate: string): string => new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-GB");

export function LessonList() {
  const [state, setState] = useState<ListState>({ kind: "loading" });

  useEffect(() => {
    teacherApi
      .listLessons()
      .then((lessons) => setState({ kind: "ready", lessons }))
      .catch((error: unknown) => {
        const status = error instanceof ApiError ? error.status : 0;
        setState({ kind: "error", message: loadErrorFr(status) });
      });
  }, []);

  if (state.kind === "loading") return <p className="text-base text-neutral-600">Loading…</p>;
  if (state.kind === "error") return <p role="alert" className="text-base text-red-700">{state.message}</p>;
  if (state.lessons.length === 0) return <p className="text-base text-neutral-600">No lessons yet.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {state.lessons.map((lesson) => (
        <li key={lesson.id}>
          <Link
            href={`/teacher/lessons/${lesson.id}`}
            className="flex items-baseline justify-between gap-4 rounded-2xl border border-[#e2ded9] bg-white px-5 py-4 hover:bg-neutral-50"
          >
            <span className="flex flex-col">
              <span className="text-base font-semibold">{lesson.title}</span>
              <span className="text-sm text-neutral-600">{lesson.subject}</span>
            </span>
            <span className="text-sm tabular-nums text-neutral-600">{formatDate(lesson.lesson_date)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
