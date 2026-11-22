// The title the student gives a class when she starts it, to recognise its clips at home.
// Kept in this browser only (no server change): a clip takes the title of the last class started before it.

export type ClassTitle = { startedAt: string; title: string };

const KEY = "loopd-class-titles";
const KEEP = 50;

function read(): ClassTitle[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as ClassTitle[]) : [];
  } catch {
    return [];
  }
}

export function titleAt(titles: ClassTitle[], createdAt: string): string | null {
  const at = Date.parse(createdAt);
  const before = titles.filter((t) => Date.parse(t.startedAt) <= at);
  if (before.length === 0) return null;
  return before.reduce((last, t) => (Date.parse(t.startedAt) > Date.parse(last.startedAt) ? t : last)).title || null;
}

export function saveClassTitle(title: string, startedAt: Date = new Date()): void {
  // a class without a title is saved too, so its clips do not take the title of the class before
  try {
    localStorage.setItem(KEY, JSON.stringify([...read(), { startedAt: startedAt.toISOString(), title: title.trim() }].slice(-KEEP)));
  } catch {
    /* private mode or storage full: the clip keeps the lesson title */
  }
}

export const clipTitle = (createdAt: string): string | null => titleAt(read(), createdAt);
