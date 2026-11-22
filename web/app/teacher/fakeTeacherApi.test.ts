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
