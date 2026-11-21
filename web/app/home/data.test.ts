import { describe, expect, it } from "vitest";
import { getHomeReview, getProgress, savePractice } from "./data";

describe("home data seam", () => {
  it("getHomeReview returns déchet at level 0", async () => {
    const review = await getHomeReview();
    expect(review.words_to_practice[0]).toMatchObject({ lemma: "déchet", level: 0 });
    expect(review.clips[0].terms).toContain("déchet");
  });

  it("savePractice levels up", async () => {
    const res = await savePractice({ lemma: "déchet", clip_id: "c1…", passed: true });
    expect(res).toEqual({ lemma: "déchet", level: 1, leveled_up: true });
  });

  it("getProgress has the 3 kinds", async () => {
    const { messages } = await getProgress();
    expect(messages.map((m) => m.kind)).toEqual(["learned_this_week", "no_help_needed", "keep_going"]);
  });
});
