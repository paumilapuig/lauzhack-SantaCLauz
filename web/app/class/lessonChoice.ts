/** Lesson for this class: `/class?lesson=<id>` wins (demo), otherwise the newest lesson from the API. */
export async function chooseLessonId(search: string, latestLessonId: () => Promise<string>): Promise<string> {
  return new URLSearchParams(search).get("lesson") || latestLessonId();
}
