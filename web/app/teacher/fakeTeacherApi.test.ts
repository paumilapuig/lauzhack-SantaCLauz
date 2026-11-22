import { describe, expect, it } from "vitest";
import { createFakeTeacherApi, DEMO_LESSON_ID } from "./fakeTeacherApi";

describe("createFakeTeacherApi (demo mode, no server)", () => {
  it("lists the demo lesson and opens its dashboard", async () => {
    const api = createFakeTeacherApi();
    const [lesson] = await api.listLessons();
    expect(lesson.id).toBe(DEMO_LESSON_ID);
    const dashboard = await api.getDashboard(lesson.id);
    expect(dashboard.lesson.title).toBe(lesson.title);
    expect(dashboard.lost_peaks.length).toBeGreaterThan(0);
    expect(dashboard.unclear_peaks.length).toBeGreaterThan(0);
    expect(dashboard.students.length).toBeGreaterThan(1);
  });

  it("a new lesson is added to the list and opens the demo dashboard with its title", async () => {
    const api = createFakeTeacherApi();
    const created = await api.createLessonFromText({ title: "Photosynthèse", subject: "SVT", lesson_date: "2026-11-23" }, "texte");
    expect((await api.listLessons()).map((l) => l.title)).toContain("Photosynthèse");
    expect((await api.getDashboard(created.lesson_id)).lesson.title).toBe("Photosynthèse");
  });
});

describe("createFakeTeacherApi courses", () => {
  it("starts with a demo course that holds the demo lesson", async () => {
    const api = createFakeTeacherApi();
    const [course] = await api.listCourses();
    expect(course.lesson_count).toBe(1);
    expect((await api.listLessons()).find((l) => l.id === DEMO_LESSON_ID)?.course_id).toBe(course.id);
  });

  it("creates a course, adds a lesson to it and counts it", async () => {
    const api = createFakeTeacherApi();
    const bio = await api.createCourse("  Biologie 1re ");
    expect(bio).toMatchObject({ name: "Biologie 1re", lesson_count: 0 });
    const created = await api.createLessonFromText({ title: "La cellule", subject: "Biologie", lesson_date: "2026-11-24", course_id: bio.id }, "texte");
    expect((await api.listLessons()).find((l) => l.id === created.lesson_id)?.course_id).toBe(bio.id);
    expect((await api.listCourses()).find((c) => c.id === bio.id)?.lesson_count).toBe(1);
  });

  it("moves a lesson out of its course and into another", async () => {
    const api = createFakeTeacherApi();
    const bio = await api.createCourse("Biologie 1re");
    expect(await api.moveLesson(DEMO_LESSON_ID, bio.id)).toEqual({ id: DEMO_LESSON_ID, course_id: bio.id });
    await api.moveLesson(DEMO_LESSON_ID, null);
    expect((await api.listLessons()).find((l) => l.id === DEMO_LESSON_ID)?.course_id).toBeNull();
  });

  it("rejects a blank course name like the API (422)", async () => {
    await expect(createFakeTeacherApi().createCourse("   ")).rejects.toMatchObject({ status: 422 });
  });
});
