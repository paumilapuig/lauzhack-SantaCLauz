import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createScriptPlayer } from "./scriptPlayer";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("createScriptPlayer", () => {
  it("plays one sentence per interval, then stops by itself", () => {
    const onSentence = vi.fn();
    const player = createScriptPlayer({ sentences: ["Un.", "Deux."], intervalMs: 4000, onSentence });
    player.start();
    expect(onSentence).toHaveBeenNthCalledWith(1, "Un.");
    vi.advanceTimersByTime(4000);
    expect(onSentence).toHaveBeenNthCalledWith(2, "Deux.");
    vi.advanceTimersByTime(8000);
    expect(onSentence).toHaveBeenCalledTimes(2);
    expect(player.playing()).toBe(false);
  });

  it("stop halts it", () => {
    const onSentence = vi.fn();
    const player = createScriptPlayer({ sentences: ["Un.", "Deux."], intervalMs: 4000, onSentence });
    player.start();
    player.stop();
    vi.advanceTimersByTime(8000);
    expect(onSentence).toHaveBeenCalledTimes(1);
  });
});
