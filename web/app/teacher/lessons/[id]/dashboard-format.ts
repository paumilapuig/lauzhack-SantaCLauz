import type {
  ConceptGapStatus,
  LostPeak,
  WeeklyAutonomy,
} from "../../teacher-contract";

export interface PeakBar {
  minute: number;
  count: number;
  widthPct: number;
  isMax: boolean;
}

const STATUS_LABELS_FR: Record<ConceptGapStatus, string> = {
  pending: "à faire",
  review: "à revoir",
  understood: "compris",
};

export function peakBars(peaks: LostPeak[]): PeakBar[] {
  const max = Math.max(...peaks.map((peak) => peak.count));
  return [...peaks]
    .sort((a, b) => a.minute - b.minute)
    .map(({ minute, count }) => ({
      minute,
      count,
      widthPct: (count / max) * 100,
      isMax: count === max,
    }));
}

export function statusLabelFr(status: ConceptGapStatus): string {
  return STATUS_LABELS_FR[status];
}

export function formatMinutes(minutes: number[]): string {
  return minutes.length === 0 ? "—" : `min ${minutes.join(", ")}`;
}

export function formatAutonomy(autonomy: number | null): string | null {
  return autonomy === null ? null : `${Math.round(autonomy * 100)} %`;
}

export function sparklinePoints(
  weekly: WeeklyAutonomy[],
  width: number,
  height: number,
): string {
  if (weekly.length < 2) return "";
  const lastIndex = weekly.length - 1;
  return weekly
    .map(
      ({ autonomy }, i) =>
        `${(i * width) / lastIndex},${height - autonomy * height}`,
    )
    .join(" ");
}
