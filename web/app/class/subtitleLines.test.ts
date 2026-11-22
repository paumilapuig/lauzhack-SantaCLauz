import { describe, expect, it } from "vitest";
import { addResult, EMPTY_SUBTITLES } from "./subtitleLines";

describe("addResult", () => {
  it("shows the interim text while the sentence is being spoken", () => {
    const state = addResult(EMPTY_SUBTITLES, { finalText: "", interimText: "les cellules" });
    expect(state).toEqual({ finals: [], interim: "les cellules" });
  });

  it("keeps a finished sentence when the next one starts", () => {
    let state = addResult(EMPTY_SUBTITLES, { finalText: "les cellules respirent", interimText: "" });
    state = addResult(state, { finalText: "", interimText: "et produisent" });
    expect(state).toEqual({ finals: ["les cellules respirent"], interim: "et produisent" });
  });

  it("keeps only the last three finished sentences", () => {
    let state = EMPTY_SUBTITLES;
    for (const text of ["un", "deux", "trois", "quatre"]) {
      state = addResult(state, { finalText: text, interimText: "" });
    }
    expect(state.finals).toEqual(["deux", "trois", "quatre"]);
  });

  it("ignores empty results", () => {
    const state = addResult({ finals: ["un"], interim: "deux" }, { finalText: " ", interimText: "" });
    expect(state).toEqual({ finals: ["un"], interim: "deux" });
  });
});
