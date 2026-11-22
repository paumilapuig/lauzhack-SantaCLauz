"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { Course, LessonSummary } from "./teacher-contract";
import { teacherApi } from "./teacher-api-client";
import { loadErrorFr } from "./teacher-errors";

export type TeacherData =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; courses: Course[]; lessons: LessonSummary[] };

/** An API from before courses answers 404: show every lesson as "not in a course" instead of failing. */
const coursesOrNone = (): Promise<Course[]> =>
  teacherApi.listCourses().catch((error: unknown) =>
    error instanceof ApiError && error.status === 404 ? [] : Promise.reject(error),
  );

/** Her courses and lessons, loaded together; `reload` after creating or moving something. */
export function useTeacherData(): { data: TeacherData; reload: () => void } {
  const [data, setData] = useState<TeacherData>({ kind: "loading" });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let live = true;
    Promise.all([coursesOrNone(), teacherApi.listLessons()])
      .then(([courses, lessons]) => {
        if (live) setData({ kind: "ready", courses, lessons });
      })
      .catch((error: unknown) => {
        if (live) setData({ kind: "error", message: loadErrorFr(error instanceof ApiError ? error.status : 0) });
      });
    return () => {
      live = false;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, reload };
}
