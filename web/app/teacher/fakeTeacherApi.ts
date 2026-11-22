import { ApiError } from "@/lib/api";
import type { TeacherApi } from "./teacherApi";
import type { Course, LessonSummary, NewLessonFields, TeacherDashboard } from "./teacher-contract";

export const DEMO_LESSON_ID = "de100000-0000-4000-8000-000000000001";
const DEMO_COURSE_ID = "de200000-0000-4000-8000-000000000001";

/** The demo lesson as the real API shows it after a few classes (shape of docs/API.md › Dashboard). */
const DEMO_DASHBOARD: Omit<TeacherDashboard, "lesson"> = {
  lost_peaks: [
    { minute: 12, count: 6 },
    { minute: 3, count: 2 },
    { minute: 8, count: 1 },
  ],
  unclear_peaks: [
    { minute: 12, count: 3 },
    { minute: 4, count: 2 },
    { minute: 1, count: 1 },
    { minute: 9, count: 1 },
  ],
  concept_gaps: [
    { student: "Lucía (semaine 4)", concept: "Pourquoi on a chaud pendant l'effort", minutes: [3], lemmas: ["chaleur"], status: "understood", attempts: 2 },
    { student: "Lucía (semaine 4)", concept: "Comment la cellule fabrique de l'énergie", minutes: [12], lemmas: ["mitochondrie"], status: "review", attempts: 1 },
    { student: "Lucía (semaine 1)", concept: "La respiration cellulaire produit des déchets", minutes: [12], lemmas: ["déchet"], status: "pending", attempts: 0 },
    { student: "Yusuf (semaine 2)", concept: "La mitochondrie, la centrale d'énergie de la cellule", minutes: [12], lemmas: ["mitochondrie"], status: "understood", attempts: 1 },
  ],
  top_words: [
    { lemma: "déchet", taps: 5 },
    { lemma: "chaleur", taps: 4 },
    { lemma: "essoufflé", taps: 3 },
    { lemma: "mitochondrie", taps: 2 },
    { lemma: "dégager", taps: 2 },
    { lemma: "rejeter", taps: 1 },
  ],
  students: [
    { name: "Lucía (semaine 1)", autonomy: 0.53, weekly: [{ week: "2026-W47", autonomy: 0.53 }] },
    {
      name: "Lucía (semaine 4)",
      autonomy: 0.8,
      weekly: [
        { week: "2026-W44", autonomy: 0.53 },
        { week: "2026-W45", autonomy: 0.62 },
        { week: "2026-W46", autonomy: 0.71 },
        { week: "2026-W47", autonomy: 0.8 },
      ],
    },
    {
      name: "Yusuf (semaine 2)",
      autonomy: 0.67,
      weekly: [
        { week: "2026-W46", autonomy: 0.58 },
        { week: "2026-W47", autonomy: 0.67 },
      ],
    },
  ],
};

/** Teacher pages in demo mode: the demo course and lesson in the browser, no server and no login. */
export function createFakeTeacherApi(): TeacherApi {
  const courses: Omit<Course, "lesson_count">[] = [{ id: DEMO_COURSE_ID, name: "SVT 11e" }];
  const lessons: LessonSummary[] = [
    { id: DEMO_LESSON_ID, title: "La respiration cellulaire", subject: "SVT", lesson_date: "2026-11-22", course_id: DEMO_COURSE_ID },
  ];

  const withCount = (course: Omit<Course, "lesson_count">): Course => ({
    ...course,
    lesson_count: lessons.filter((lesson) => lesson.course_id === course.id).length,
  });

  function create({ course_id, ...fields }: NewLessonFields) {
    const id = `demo-${lessons.length}`;
    lessons.unshift({ id, ...fields, course_id: course_id ?? null });
    return Promise.resolve({ lesson_id: id, terms: [] });
  }

  return {
    listLessons: async () => [...lessons],
    createLessonFromText: (fields) => create(fields),
    createLessonFromFile: (fields) => create(fields),
    async getDashboard(lessonId) {
      const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[lessons.length - 1];
      return { lesson: { id: lesson.id, title: lesson.title }, ...DEMO_DASHBOARD };
    },
    listCourses: async () => [...courses].sort((a, b) => a.name.localeCompare(b.name)).map(withCount),
    async createCourse(name) {
      const trimmed = name.trim();
      if (trimmed.length === 0 || trimmed.length > 80) throw new ApiError(422, "Invalid course name");
      const course = { id: `demo-course-${courses.length}`, name: trimmed };
      courses.push(course);
      return withCount(course);
    },
    async moveLesson(lessonId, courseId) {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) throw new ApiError(404, "Lesson not found");
      lesson.course_id = courseId;
      return { id: lessonId, course_id: courseId };
    },
  };
}
