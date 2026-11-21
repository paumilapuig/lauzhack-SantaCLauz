import { describe, expect, it } from "vitest";
import { renderSegments } from "./render";
import type { Segment } from "./wordState";

const term = (state: Segment["state"], translationEs: string | null = null): Segment => ({
  text: "mot",
  lemma: "mot",
  state,
  translationEs,
});
const plain = (text: string): Segment => ({ text, lemma: null, state: null, translationEs: null });

describe("renderSegments", () => {
  it("escapes html in plain text", () => {
    const html = renderSegments([plain("<script>alert(1)</script>")]);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes html in term text", () => {
    const html = renderSegments([{ ...term("green"), text: "<b>" }]);
    expect(html).toContain("&lt;b&gt;");
  });

  it("renders yellow terms with their translation", () => {
    const html = renderSegments([term("yellow", "expulsar")]);
    expect(html).toContain('class="term term--yellow"');
    expect(html).toContain('data-lemma="mot"');
    expect(html).toContain('<small class="tr">expulsar</small>');
  });

  it("renders green and orange terms without translation", () => {
    const green = renderSegments([term("green")]);
    const orange = renderSegments([term("orange")]);
    expect(green).toContain("term--green");
    expect(orange).toContain("term--orange");
    expect(green + orange).not.toContain("<small");
  });
});
