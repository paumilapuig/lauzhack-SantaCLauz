import { describe, expect, it } from "vitest";
import {
  formatAutonomy,
  formatMinutes,
  peakBars,
  sparklinePoints,
  statusLabelFr,
} from "./dashboard-format";

describe("peakBars", () => {
  it("returns an empty list for empty input", () => {
    expect(peakBars([])).toEqual([]);
  });

  it("sorts by minute and scales widths", () => {
    expect(
      peakBars([
        { minute: 12, count: 5 },
        { minute: 3, count: 2 },
      ]),
    ).toEqual([
      { minute: 3, count: 2, widthPct: 40, isMax: false },
      { minute: 12, count: 5, widthPct: 100, isMax: true },
    ]);
  });

  it("returns [] for no peaks", () => {
    expect(peakBars([])).toEqual([]);
  });
});

describe("labels and numbers", () => {
  it("labels statuses in French", () => {
    expect(statusLabelFr("pending")).toBe("à faire");
    expect(statusLabelFr("review")).toBe("à revoir");
    expect(statusLabelFr("understood")).toBe("compris");
  });

  it("formats minutes", () => {
    expect(formatMinutes([3, 12])).toBe("min 3, 12");
    expect(formatMinutes([])).toBe("—");
  });

  it("formats autonomy", () => {
    expect(formatAutonomy(0.8)).toBe("80 %");
    expect(formatAutonomy(0.534)).toBe("53 %");
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
