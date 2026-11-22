// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import type { LessonSummary } from "./teacher-contract";

const moveLesson = vi.fn();
vi.mock("./teacher-api-client", () => ({ teacherApi: { moveLesson: (...args: unknown[]) => moveLesson(...args) } }));

const { AddExistingLesson } = await import("./add-existing-lesson");

const LOOSE: LessonSummary[] = [
  { id: "l1", title: "Les volcans", subject: "Géo", lesson_date: "2026-11-20", course_id: null },
  { id: "l2", title: "La cellule", subject: "Bio", lesson_date: "2026-11-21", course_id: null },
];

afterEach(() => {
  cleanup();
  moveLesson.mockReset();
});

describe("AddExistingLesson", () => {
  it("shows nothing when every lesson already has a course", () => {
    const { container } = render(<AddExistingLesson courseId="bio" lessons={[]} onAdded={() => {}} />);
    expect(container.innerHTML).toBe("");
  });

  it("moves the chosen lesson into the course, then reloads", async () => {
    moveLesson.mockResolvedValue({ id: "l2", course_id: "bio" });
    const onAdded = vi.fn();
    render(<AddExistingLesson courseId="bio" lessons={LOOSE} onAdded={onAdded} />);
    fireEvent.change(screen.getByLabelText("Add a lesson you already have"), { target: { value: "l2" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(onAdded).toHaveBeenCalled());
    expect(moveLesson).toHaveBeenCalledWith("l2", "bio");
  });

  it("explains a refusal and does not reload", async () => {
    moveLesson.mockRejectedValue(new ApiError(403, "Not your lesson"));
    const onAdded = vi.fn();
    render(<AddExistingLesson courseId="bio" lessons={LOOSE} onAdded={onAdded} />);
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect((await screen.findByRole("alert")).textContent).toBe("This lesson is not yours.");
    expect(onAdded).not.toHaveBeenCalled();
  });
});
