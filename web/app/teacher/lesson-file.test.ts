import { describe, expect, it } from "vitest";
import { MAX_LESSON_FILE_BYTES, validateLessonFile } from "./lesson-file";

const file = (name: string, size: number, type = "") => ({ name, size, type });

describe("validateLessonFile", () => {
  it("accepts a file of exactly the maximum size", () => {
    expect(validateLessonFile(file("a.pdf", MAX_LESSON_FILE_BYTES))).toBeNull();
  });

  it("rejects one byte over the maximum", () => {
    expect(validateLessonFile(file("a.pdf", MAX_LESSON_FILE_BYTES + 1))).toBe(
      "File too large (10 MB maximum).",
    );
  });

  it("rejects unsupported formats", () => {
    expect(validateLessonFile(file("a.docx", 10))).toBe(
      "Format not accepted: txt, PDF, PNG or JPG.",
    );
  });

  it("accepts by mime type when the extension is missing", () => {
    expect(validateLessonFile(file("photo", 10, "image/jpeg"))).toBeNull();
  });

  it("accepts by extension case-insensitively", () => {
    expect(validateLessonFile(file("A.JPEG", 10))).toBeNull();
  });

  it("rejects an empty file", () => {
    expect(validateLessonFile(file("a.txt", 0))).toBe("The file is empty.");
  });
});
