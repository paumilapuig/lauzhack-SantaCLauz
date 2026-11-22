import { describe, expect, it } from "vitest";
import { addResult, EMPTY_SUBTITLES, lineText } from "./subtitleLines";

describe("addResult + lineText", () => {
  it("shows the interim text while the sentence is being spoken", () => {
    const state = addResult(EMPTY_SUBTITLES, { finalText: "", interimText: "les cellules", at: 1 });
    expect(lineText(state)).toBe("les cellules");
  });

  it("joins finished sentences and the interim text into one line", () => {
    let state = addResult(EMPTY_SUBTITLES, { finalText: "les cellules respirent", interimText: "", at: 1 });
    state = addResult(state, { finalText: "", interimText: "et produisent", at: 2 });
    expect(lineText(state)).toBe("les cellules respirent et produisent");
  });

  it("keeps only the last three finished sentences", () => {
    let state = EMPTY_SUBTITLES;
    ["un", "deux", "trois", "quatre"].forEach((text, i) => {
      state = addResult(state, { finalText: text, interimText: "", at: i });
    });
    expect(lineText(state)).toBe("deux trois quatre");
  });

  it("starts a fresh line after a silence longer than the idle time", () => {
    let state = addResult(EMPTY_SUBTITLES, { finalText: "avant", interimText: "", at: 1 });
    state = addResult(state, { finalText: "", interimText: "après", at: 10 });
    expect(lineText(state)).toBe("après");
  });

  it("ignores empty results", () => {
    const before = addResult(EMPTY_SUBTITLES, { finalText: "un", interimText: "", at: 1 });
    expect(addResult(before, { finalText: " ", interimText: "", at: 2 })).toBe(before);
  });
});
