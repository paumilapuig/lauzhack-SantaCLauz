import { describe, expect, it, vi } from "vitest";
import { createHttpHomeApi, toMyWord } from "./homeApi";

function fakeRequest(response: unknown = { ok: true }) {
  return vi.fn(async () => response as never);
}

describe("createHttpHomeApi", () => {
  it("loads the review", async () => {
    const request = fakeRequest({ clips: [], words_to_practice: [] });
    await createHttpHomeApi(request).review();
    expect(request).toHaveBeenCalledWith("/api/home/review");
  });

  it("marks and unmarks a word on its clip (word is URL-encoded)", async () => {
    const request = fakeRequest({ word: "déchets", lemma: "déchet", translation_es: "desecho", level: 0 });
    const api = createHttpHomeApi(request);
    expect((await api.mark("c1", "déchets")).translation_es).toBe("desecho");
    expect(request).toHaveBeenCalledWith("/api/clips/c1/marks", { method: "POST", body: JSON.stringify({ word: "déchets" }) });
    await api.unmark("c1", "déchets");
    expect(request).toHaveBeenLastCalledWith(`/api/clips/c1/marks/${encodeURIComponent("déchets")}`, { method: "DELETE" });
  });

  it("finishes a clip and saves practice", async () => {
    const request = fakeRequest();
    const api = createHttpHomeApi(request);
    await api.finishClip("c1");
    expect(request).toHaveBeenCalledWith("/api/clips/c1/reviewed", { method: "POST" });
    await api.practice({ lemma: "déchet", clip_id: "c1", passed: true });
    expect(request).toHaveBeenLastCalledWith("/api/practice", {
      method: "POST",
      body: JSON.stringify({ lemma: "déchet", clip_id: "c1", passed: true }),
    });
  });

  it("sends the answers of a concept", async () => {
    const request = fakeRequest({ correct: [true, false], status: "review" });
    const result = await createHttpHomeApi(request).answerConcept("g1", [0, 2]);
    expect(result.status).toBe("review");
    expect(request).toHaveBeenCalledWith("/api/concepts/g1/answers", { method: "POST", body: JSON.stringify({ answers: [0, 2] }) });
  });

  it("loads progress", async () => {
    const request = fakeRequest({ messages: [] });
    await createHttpHomeApi(request).progress();
    expect(request).toHaveBeenCalledWith("/api/me/progress");
  });
});

describe("toMyWord", () => {
  it("uses the glossary lemma and fills missing texts with empty strings", () => {
    const word = toMyWord({
      word: "énergie", lemma: null, translation_es: null, definition_fr: null,
      key_phrase: "de l'énergie", level: null, clip_id: "c1",
    });
    expect(word).toEqual({
      lemma: "énergie", glossary_lemma: null, translation_es: "", definition_fr: "",
      key_phrase: "de l'énergie", clip_id: "c1",
    });
  });

  it("keeps glossary words practicable", () => {
    const word = toMyWord({
      word: "déchets", lemma: "déchet", translation_es: "desecho", definition_fr: "Ce qui reste.",
      key_phrase: "des déchets", level: 0, clip_id: "c1",
    });
    expect(word.lemma).toBe("déchet");
    expect(word.glossary_lemma).toBe("déchet");
  });
});
