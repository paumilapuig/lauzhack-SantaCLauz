import { describe, expect, it } from "vitest";
import { splitByTerms } from "./transcript";

describe("splitByTerms", () => {
  it("marks words starting with a term, ignores unmatched terms", () => {
    const parts = splitByTerms("elle produit aussi des déchets et", ["déchet", "dioxyde de carbone", "zzz"]);
    expect(parts.filter((p) => p.lemma)).toEqual([{ text: "déchets", lemma: "déchet" }]);
    expect(parts.map((p) => p.text).join("")).toBe("elle produit aussi des déchets et");
  });
  it("matches multi-word terms", () => {
    const parts = splitByTerms("du dioxyde de carbone.", ["dioxyde de carbone"]);
    expect(parts.find((p) => p.lemma)?.text).toBe("dioxyde de carbone");
  });
});
