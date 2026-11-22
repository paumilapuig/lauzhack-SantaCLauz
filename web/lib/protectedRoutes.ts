const ALWAYS_PROTECTED = ["/dashboard"];
// demo mode runs on in-browser data (no real student or lesson), so it must also work offline
const DEMO_PAGES = ["/class", "/home", "/progress", "/teacher"];

const under = (pathname: string, prefixes: string[]) => prefixes.some((prefix) => pathname.startsWith(prefix));

/** Student and teacher pages need a login only with the real API; demo mode must also work offline. */
export function needsLogin(pathname: string, mode: "http" | "mock"): boolean {
  return under(pathname, ALWAYS_PROTECTED) || (mode === "http" && under(pathname, DEMO_PAGES));
}
