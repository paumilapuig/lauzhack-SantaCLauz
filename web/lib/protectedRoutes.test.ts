import { describe, expect, it } from "vitest";
import { needsLogin } from "./protectedRoutes";

describe("needsLogin", () => {
  it("always protects the dashboard and the teacher pages", () => {
    expect(needsLogin("/dashboard", "mock")).toBe(true);
    expect(needsLogin("/teacher/lessons/1", "mock")).toBe(true);
  });

  it("protects the student pages when the web talks to the real API", () => {
    for (const path of ["/class", "/home", "/progress"]) expect(needsLogin(path, "http")).toBe(true);
  });

  it("keeps the student pages open in demo mode (offline plan B)", () => {
    for (const path of ["/class", "/home", "/progress"]) expect(needsLogin(path, "mock")).toBe(false);
  });

  it("never protects the login page", () => {
    expect(needsLogin("/login", "http")).toBe(false);
  });
});
