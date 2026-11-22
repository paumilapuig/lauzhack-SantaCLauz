import { describe, expect, it } from "vitest";
import { isRevisionOf } from "./finalRevision";

describe("isRevisionOf", () => {
  it("treats a longer version of the same sentence as a revision (real data from a test class)", () => {
    expect(isRevisionOf("aujourd hui je suis très Jol", "aujourd hui je suis très jolie de la")).toBe(true);
    expect(isRevisionOf("aujourd hui je suis très jolie de la", "aujourd hui je suis très jolie et la")).toBe(true);
  });

  it("keeps genuinely new sentences", () => {
    expect(isRevisionOf("les mitochondries utilisent l'oxygène", "cette réaction libère de l'énergie")).toBe(false);
    expect(isRevisionOf("elle produit", "elle aussi")).toBe(false);
  });

  it("ignores case and punctuation", () => {
    expect(isRevisionOf("Les cellules respirent.", "les cellules respirent, et produisent")).toBe(true);
  });
});
