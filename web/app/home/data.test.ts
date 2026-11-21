import { describe, expect, it } from "vitest";
import { getHomeReview, getMyWords, getProgress, removeMark, savePractice, saveMark, translate } from "./data";

const FUNCTION_WORDS = new Set(
  "les le la l de des du et pour nos nous cette ces elle va se c est qu on a quand jusqu aux une un ça sous".split(" "),
);

describe("dictionary and marks", () => {
  it("translate is case-insensitive and null for function words", () => {
    expect(translate("Mitochondries")).toBe("mitocondrias");
    expect(translate("les")).toBeNull();
  });

  it("every content word of both transcripts has an entry", async () => {
    const { clips } = await getHomeReview();
    const words = clips.flatMap((c) => c.transcript.split(/[^\p{L}]+/u)).map((w) => w.toLowerCase());
    const missing = words.filter((w) => w && !FUNCTION_WORDS.has(w) && translate(w) === null);
    expect(missing).toEqual([]);
  });

  it("getMyWords starts with the 3 seeded marks, déchets in its transcript form", async () => {
    expect((await getMyWords()).map((w) => w.lemma)).toEqual(["déchets", "chaleur", "essoufflé"]);
  });

  it("saveMark adds a word with its sentence, removeMark deletes it", async () => {
    expect(await getMyWords()).toHaveLength(3);
    await saveMark("mitochondries", "c1…");
    const words = await getMyWords();
    expect(words).toHaveLength(4);
    expect(words[3]).toMatchObject({
      lemma: "mitochondries",
      translation_es: "mitocondrias",
      clip_id: "c1…",
      key_phrase: "Les mitochondries utilisent l'oxygène pour transformer le glucose.",
    });
    await removeMark("mitochondries");
    expect(await getMyWords()).toHaveLength(3);
  });
});

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

  it("savePractice keeps the level when not passed", async () => {
    const res = await savePractice({ lemma: "essoufflé", clip_id: null, passed: false });
    expect(res).toEqual({ lemma: "essoufflé", level: 0, leveled_up: false });
  });

  it("getProgress has the 3 kinds", async () => {
    const { messages } = await getProgress();
    expect(messages.map((m) => m.kind)).toEqual(["learned_this_week", "no_help_needed", "keep_going"]);
  });
});
