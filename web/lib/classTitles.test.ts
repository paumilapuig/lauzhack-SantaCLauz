// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { clipTitle, saveClassTitle, titleAt } from "./classTitles";

beforeEach(() => localStorage.clear());

describe("class titles", () => {
  const titles = [
    { startedAt: "2026-11-22T09:00:00Z", title: "Bio — la cellule" },
    { startedAt: "2026-11-22T10:00:00Z", title: "Bio — la respiration" },
  ];

  it("a clip takes the title of the last class started before it", () => {
    expect(titleAt(titles, "2026-11-22T09:20:00Z")).toBe("Bio — la cellule");
    expect(titleAt(titles, "2026-11-22T10:05:00Z")).toBe("Bio — la respiration");
    expect(titleAt(titles, "2026-11-22T08:59:00Z")).toBeNull();
  });

  it("saves a trimmed title in the browser; a class started without one gives its clips none", () => {
    saveClassTitle("  Bio — la cellule ", new Date("2026-11-22T09:00:00Z"));
    saveClassTitle("   ", new Date("2026-11-22T10:00:00Z"));
    expect(clipTitle("2026-11-22T09:30:00Z")).toBe("Bio — la cellule");
    expect(clipTitle("2026-11-22T10:30:00Z")).toBeNull();
  });
});
