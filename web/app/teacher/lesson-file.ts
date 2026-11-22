import { createLessonErrorFr } from "./teacher-errors";

export const MAX_LESSON_FILE_BYTES = 10 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = [".txt", ".pdf", ".png", ".jpg", ".jpeg"];
const ACCEPTED_MIME_TYPES = ["text/plain", "application/pdf", "image/png", "image/jpeg"];

type LessonFileInfo = { name: string; size: number; type: string };

const isAcceptedFormat = ({ name, type }: LessonFileInfo): boolean =>
  ACCEPTED_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext)) ||
  ACCEPTED_MIME_TYPES.includes(type);

export function validateLessonFile(file: LessonFileInfo): string | null {
  if (file.size === 0) return "The file is empty.";
  if (file.size > MAX_LESSON_FILE_BYTES) return createLessonErrorFr(413);
  if (!isAcceptedFormat(file)) return createLessonErrorFr(415);
  return null;
}
