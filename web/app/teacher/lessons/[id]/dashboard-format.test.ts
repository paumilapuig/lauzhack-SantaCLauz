import { describe, expect, it } from "vitest";
import {
  formatAutonomy,
  formatMinutes,
  sparklinePoints,
  statusLabel,
} from "./dashboard-format";

describe("labels and numbers", () => {
  it("labels statuses in French", () => {
    expect(statusLabel("pending")).toBe("not studied yet");
    expect(statusLabel("review")).toBe("still confused");
    expect(statusLabel("understood")).toBe("understood");
  });

  it("formats minutes", () => {
    expect(formatMinutes([3, 12])).toBe("min 3, 12");
    expect(formatMinutes([])).toBe("—");
  });

  it("formats autonomy", () => {
    expect(formatAutonomy(0.8)).toBe("80%");
    expect(formatAutonomy(0.534)).toBe("53%");
    expect(formatAutonomy(null)).toBeNull();
  });
});

describe("sparklinePoints", () => {
  it("maps weeks to svg points", () => {
    const weekly = [
      { week: "W44", autonomy: 0.5 },
      { week: "W45", autonomy: 1 },
    ];
    expect(sparklinePoints(weekly, 100, 20)).toBe("0,10 100,0");
  });

  it("returns empty string under 2 points", () => {
    expect(sparklinePoints([{ week: "W44", autonomy: 0.5 }], 100, 20)).toBe("");
  });
});
