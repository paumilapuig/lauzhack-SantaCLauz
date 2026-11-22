import { describe, expect, it } from "vitest";
import { createLessonErrorFr, loadErrorFr } from "./teacher-errors";

describe("createLessonErrorFr", () => {
  it.each([
    [401, "Session expired, please sign in again."],
    [403, "Teachers only."],
    [413, "File too large (10 MB maximum)."],
    [415, "Format not accepted: txt, PDF, PNG or JPG."],
    [422, "A field is missing, or the text/file is empty or unreadable."],
    [502, "The AI could not prepare the glossary. Please try again."],
    [503, "The AI is not configured on the server."],
    [500, "Could not save the lesson. Please try again."],
    [0, "Server unreachable."],
    [418, "Unexpected error (code 418)."],
  ])("maps %i", (status, text) => {
    expect(createLessonErrorFr(status)).toBe(text);
  });
});

describe("loadErrorFr", () => {
  it.each([
    [401, "Session expired, please sign in again."],
    [403, "This lesson is not yours."],
    [404, "Lesson not found"],
    [0, "Server unreachable."],
    [418, "Unexpected error (code 418)."],
  ])("maps %i", (status, text) => {
    expect(loadErrorFr(status)).toBe(text);
  });
});
