import { describe, expect, it, vi } from "vitest";
import { createClassButtons } from "./classButtons";

function setup(nowSec = 100) {
  const api = { startSession: vi.fn(), uploadClip: vi.fn().mockResolvedValue(undefined), postLost: vi.fn().mockResolvedValue(undefined) };
  const blob = new Blob(["a"]);
  const recorder = { start: vi.fn(), stop: vi.fn(), clip: vi.fn().mockResolvedValue({ blob, tStart: 88, tEnd: 100 }) };
  const transcript = { add: vi.fn(), prune: vi.fn(), textBetween: vi.fn((a: number, b: number) => `text ${a}-${b}`) };
  const buttons = createClassButtons({ api, recorder, transcript, sessionId: "s1", nowSec: () => nowSec, lostWindowSec: 60 });
  return { api, recorder, transcript, buttons, blob };
}

describe("createClassButtons", () => {
  it("uploads the recorder clip with its transcript on unclear", async () => {
    const { api, buttons, blob } = setup();
    expect(await buttons.onUnclear()).toBe("saved");
    expect(api.uploadClip).toHaveBeenCalledWith({ sessionId: "s1", blob, tStart: 88, tEnd: 100, transcript: "text 88-100" });
  });

  it("posts lost with a 60 s lookback", async () => {
    const { api, buttons } = setup(100);
    expect(await buttons.onLost()).toBe("saved");
    expect(api.postLost).toHaveBeenCalledWith({ sessionId: "s1", tSec: 100, tStart: 40, transcript: "text 40-100" });
  });

  it("clamps lost tStart at 0", async () => {
    const { api, buttons } = setup(20);
    await buttons.onLost();
    expect(api.postLost).toHaveBeenCalledWith({ sessionId: "s1", tSec: 20, tStart: 0, transcript: "text 0-20" });
  });

  it("returns failed when the api rejects", async () => {
    const { api, buttons } = setup();
    api.postLost.mockRejectedValue(new Error("x"));
    api.uploadClip.mockRejectedValue(new Error("x"));
    expect(await buttons.onLost()).toBe("failed");
    expect(await buttons.onUnclear()).toBe("failed");
  });

  it("ignores a press while the same action is in flight", async () => {
    const { api, buttons } = setup();
    const results = await Promise.all([buttons.onLost(), buttons.onLost()]);
    expect(results).toEqual(["saved", "ignored"]);
    expect(api.postLost).toHaveBeenCalledTimes(1);
  });
});
