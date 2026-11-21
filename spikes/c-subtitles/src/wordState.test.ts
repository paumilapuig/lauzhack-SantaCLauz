import { describe, expect, it } from "vitest";
import glossary from "../../../docs/demo/glossary-respiration.json";
import { matchTranscript, segment, stateFor, type LessonTermInput, type Mastery } from "./wordState";

const terms = glossary as LessonTermInput[];
const noMastery: Mastery = { levels: {}, previouslyTapped: [] };
const term = (lemma: string, transparent: boolean, forms = [lemma]): LessonTermInput => ({
  lemma, forms, translation_es: "x", transparent,
});
const covered = (text: string, list = terms) =>
  matchTranscript(text, list).map((m) => text.slice(m.start, m.end));

describe("matchTranscript", () => {
  it("leaves the d' elision outside the match", () => {
    expect(covered("d'énergie")).toEqual(["énergie"]);
  });
  it("leaves the curly l’ elision outside the match", () => {
    expect(covered("l’oxygène")).toEqual(["oxygène"]);
  });
  it("matches a multi-word term as one match", () => {
    const matches = matchTranscript("la respiration cellulaire", terms);
    expect(matches).toHaveLength(1);
    expect(matches[0].lemma).toBe("respiration cellulaire");
  });
  it("prefers the longest overlapping form", () => {
    const list = [term("carbone", true), term("dioxyde de carbone", true)];
    expect(matchTranscript("du dioxyde de carbone", list).map((m) => m.lemma)).toEqual([
      "dioxyde de carbone",
    ]);
  });
  it("does not match cellule inside cellulaire", () => {
    expect(matchTranscript("cellulaire", terms).filter((m) => m.lemma === "cellule")).toEqual([]);
  });
  it("matches plural forms", () => {
    expect(covered("des énergies")).toEqual(["énergies"]);
  });
  it("maps inflected verb forms to the lemma", () => {
    expect(matchTranscript("nous les rejetons", terms).map((m) => m.lemma)).toEqual(["rejeter"]);
  });
  it("matches case-insensitively and keeps original casing", () => {
    const segs = segment("L'Énergie", terms, noMastery);
    expect(segs.find((s) => s.lemma === "énergie")?.text).toBe("Énergie");
  });
});

describe("stateFor", () => {
  it("is green by default for a transparent term without a row", () => {
    expect(stateFor(term("glucose", true), noMastery)).toBe("green");
  });
  it("is yellow by default for a non-transparent term", () => {
    expect(stateFor(term("rejeter", false), noMastery)).toBe("yellow");
  });
  it("is orange at level below 2 when previously tapped", () => {
    const mastery = { levels: { déchet: 0 }, previouslyTapped: ["déchet"] };
    expect(stateFor(term("déchet", false), mastery)).toBe("orange");
  });
  it("is green at level 2 even when tapped", () => {
    const mastery = { levels: { déchet: 2 }, previouslyTapped: ["déchet"] };
    expect(stateFor(term("déchet", false), mastery)).toBe("green");
  });
});

describe("segment", () => {
  it("concatenates back to the input", () => {
    const text = "Les mitochondries utilisent l'oxygène et rejettent des déchets.";
    expect(segment(text, terms, noMastery).map((s) => s.text).join("")).toBe(text);
  });
  it("gives a translation only to yellow segments", () => {
    const segs = segment("mitochondries et glucose", terms, {
      levels: { mitochondrie: 1, glucose: 3 }, previouslyTapped: [],
    });
    expect(segs.find((s) => s.lemma === "mitochondrie")?.translationEs).toBe("mitocondria");
    expect(segs.find((s) => s.lemma === "glucose")?.translationEs).toBeNull();
  });
});
