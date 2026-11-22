import { describe, expect, it, vi } from "vitest";
import { chooseLessonId } from "./lessonChoice";

describe("chooseLessonId", () => {
  it("uses ?lesson= from the address when present", async () => {
    const latest = vi.fn();
    expect(await chooseLessonId("?lesson=de100000-0000-4000-8000-000000000001", latest)).toBe(
      "de100000-0000-4000-8000-000000000001",
    );
    expect(latest).not.toHaveBeenCalled();
  });

  it("falls back to the newest lesson otherwise", async () => {
    expect(await chooseLessonId("", async () => "newest")).toBe("newest");
    expect(await chooseLessonId("?lesson=", async () => "newest")).toBe("newest");
  });
});
