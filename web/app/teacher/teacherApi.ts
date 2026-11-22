import { ApiError, type TokenProvider } from "@/lib/api";
import type {
  Course,
  CreateLessonResponse,
  LessonSummary,
  NewLessonFields,
  TeacherDashboard,
} from "./teacher-contract";

export interface TeacherApi {
  listLessons(): Promise<LessonSummary[]>;
  createLessonFromText(fields: NewLessonFields, sourceText: string): Promise<CreateLessonResponse>;
  createLessonFromFile(fields: NewLessonFields, file: File): Promise<CreateLessonResponse>;
  getDashboard(lessonId: string): Promise<TeacherDashboard>;
  listCourses(): Promise<Course[]>;
  createCourse(name: string): Promise<Course>;
  /** Put a lesson in one of her courses, or take it out (null) */
  moveLesson(lessonId: string, courseId: string | null): Promise<{ id: string; course_id: string | null }>;
}

export function createTeacherApi(
  baseUrl: string,
  getToken: TokenProvider,
  fetchImpl: typeof fetch = fetch,
): TeacherApi {
  async function request<T>(path: string, init: { method: string; body?: BodyInit; json?: boolean }): Promise<T> {
    const headers = new Headers();
    const token = await getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (init.json) headers.set("Content-Type", "application/json");
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, { method: init.method, headers, body: init.body });
    } catch {
      throw new ApiError(0, "network");
    }
    if (!response.ok) {
      throw new ApiError(response.status, `${init.method} ${path} failed with ${response.status}`);
    }
    return (await response.json()) as T;
  }

  return {
    listLessons: () => request("/api/lessons", { method: "GET" }),
    createLessonFromText: (fields, sourceText) =>
      request("/api/lessons", {
        method: "POST",
        json: true,
        body: JSON.stringify({ ...fields, source_text: sourceText }),
      }),
    createLessonFromFile(fields, file) {
      const form = new FormData();
      form.set("title", fields.title);
      form.set("subject", fields.subject);
      form.set("lesson_date", fields.lesson_date);
      if (fields.course_id) form.set("course_id", fields.course_id);
      form.set("file", file);
      return request("/api/lessons", { method: "POST", body: form });
    },
    getDashboard: (lessonId) =>
      request(`/api/teacher/lessons/${lessonId}/dashboard`, { method: "GET" }),
    listCourses: () => request("/api/teacher/courses", { method: "GET" }),
    createCourse: (name) =>
      request("/api/teacher/courses", { method: "POST", json: true, body: JSON.stringify({ name }) }),
    moveLesson: (lessonId, courseId) =>
      request(`/api/teacher/lessons/${lessonId}`, {
        method: "PATCH",
        json: true,
        body: JSON.stringify({ course_id: courseId }),
      }),
  };
}
