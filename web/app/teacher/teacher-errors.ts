const SESSION_EXPIRED = "Session expired, please sign in again.";
const UNREACHABLE = "Server unreachable.";

const CREATE_LESSON_ERRORS: Record<number, string> = {
  401: SESSION_EXPIRED,
  403: "Teachers only.",
  413: "File too large (10 MB maximum).",
  415: "Format not accepted: txt, PDF, PNG or JPG.",
  422: "A field is missing, or the text/file is empty or unreadable.",
  500: "Could not save the lesson. Please try again.",
  502: "The AI could not prepare the glossary. Please try again.",
  503: "The AI is not configured on the server.",
  0: UNREACHABLE,
};

const LOAD_ERRORS: Record<number, string> = {
  401: SESSION_EXPIRED,
  403: "This lesson is not yours.",
  404: "Lesson not found",
  0: UNREACHABLE,
};

const unexpected = (status: number) => `Unexpected error (code ${status}).`;

export const createLessonErrorFr = (status: number): string =>
  CREATE_LESSON_ERRORS[status] ?? unexpected(status);

export const loadErrorFr = (status: number): string =>
  LOAD_ERRORS[status] ?? unexpected(status);
