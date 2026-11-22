import { describe, expect, it } from "vitest";
import { needsLogin } from "./protectedRoutes";

describe("needsLogin", () => {
  it("always protects the dashboard", () => {
    expect(needsLogin("/dashboard", "mock")).toBe(true);
  });

  it("protects the student and teacher pages when the web talks to the real API", () => {
    for (const path of ["/class", "/home", "/progress", "/teacher", "/teacher/lessons/1"]) expect(needsLogin(path, "http")).toBe(true);
  });

  it("keeps them open in demo mode, which only shows in-browser demo data (offline plan B)", () => {
    for (const path of ["/class", "/home", "/progress", "/teacher", "/teacher/lessons/1"]) expect(needsLogin(path, "mock")).toBe(false);
  });

  it("never protects the login page", () => {
    expect(needsLogin("/login", "http")).toBe(false);
  });
});
