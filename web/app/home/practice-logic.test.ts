import { describe, expect, it } from "vitest";
import { blankPhrase, heardMatches, optionsFor } from "./practice-logic";

describe("blankPhrase", () => {
  it("blanks the word starting with the lemma", () => {
    const r = blankPhrase("Elle produit aussi des déchets : de l'eau et du dioxyde de carbone.", "déchet");
    expect(r.answerForm).toBe("déchets");
    expect(r.before).toBe("Elle produit aussi des ");
    expect(r.after).toBe(" : de l'eau et du dioxyde de carbone.");
  });
  it("falls back to lemma minus last 2 letters", () => {
    expect(blankPhrase("Elle produit des plantes", "plantent").answerForm).toBe("plantes");
  });
});

describe("optionsFor", () => {
  it("returns 3 unique options including lemma, stable", () => {
    const o = optionsFor("déchet", ["chaleur", "déchet", "eau", "sucre"]);
    expect(o).toHaveLength(3);
    expect(new Set(o).size).toBe(3);
    expect(o).toContain("déchet");
    expect(optionsFor("déchet", ["chaleur", "déchet", "eau", "sucre"])).toEqual(o);
  });
});

describe("heardMatches", () => {
  it("accent/case-insensitive prefix per word", () => {
    expect(heardMatches("des DECHETS", "déchet")).toBe(true);
    expect(heardMatches("chaleur", "déchet")).toBe(false);
  });
});
