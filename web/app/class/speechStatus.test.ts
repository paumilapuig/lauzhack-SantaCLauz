import { describe, expect, it } from "vitest";
import { speechStatus } from "./speechStatus";

describe("speechStatus", () => {
  it("is offline when the browser has no connection or Chrome's speech service fails", () => {
    expect(speechStatus({ online: false, recognizer: "listening" })).toBe("offline");
    expect(speechStatus({ online: true, recognizer: "offline" })).toBe("offline");
  });

  it("is live while listening and reconnecting while it restarts", () => {
    expect(speechStatus({ online: true, recognizer: "listening" })).toBe("live");
    expect(speechStatus({ online: true, recognizer: "restarting" })).toBe("reconnecting");
  });
});
