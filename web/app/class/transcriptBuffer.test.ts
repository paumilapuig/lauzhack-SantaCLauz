import { describe, expect, it } from "vitest";
import { createTranscriptBuffer } from "./transcriptBuffer";

describe("createTranscriptBuffer", () => {
  it("joins segments in order with single spaces", () => {
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    buffer.add("bonjour", 1);
    buffer.add("la classe", 5);
    buffer.add("commence", 9);
    expect(buffer.textBetween(0, 10)).toBe("bonjour la classe commence");
  });

  it("includes both boundaries", () => {
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    buffer.add("a", 1);
    buffer.add("b", 2);
    buffer.add("c", 3);
    expect(buffer.textBetween(1, 3)).toBe("a b c");
    expect(buffer.textBetween(2, 2)).toBe("b");
  });

  it("returns an empty string for an empty range", () => {
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    buffer.add("a", 1);
    expect(buffer.textBetween(5, 10)).toBe("");
    expect(createTranscriptBuffer({ keepSec: 90 }).textBetween(0, 10)).toBe("");
  });

  it("prunes entries older than keepSec", () => {
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    buffer.add("old", 5);
    buffer.add("edge", 10);
    buffer.add("new", 100);
    buffer.prune(100);
    expect(buffer.textBetween(0, 200)).toBe("edge new");
  });
});
