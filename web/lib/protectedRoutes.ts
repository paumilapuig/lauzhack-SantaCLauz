const ALWAYS_PROTECTED = ["/dashboard", "/teacher"];
const STUDENT_PAGES = ["/class", "/home", "/progress"];

const under = (pathname: string, prefixes: string[]) => prefixes.some((prefix) => pathname.startsWith(prefix));

/** Student pages need a login only with the real API; demo mode must also work offline. */
export function needsLogin(pathname: string, mode: "http" | "mock"): boolean {
  return under(pathname, ALWAYS_PROTECTED) || (mode === "http" && under(pathname, STUDENT_PAGES));
}
