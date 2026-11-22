/** "http" talks to the FastAPI backend; anything else runs the in-browser demo data. */
export function apiMode(setting = process.env.NEXT_PUBLIC_CLASS_API): "http" | "mock" {
  return setting === "http" ? "http" : "mock";
}
