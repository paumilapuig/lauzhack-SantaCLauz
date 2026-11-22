import type {
  ConceptGapStatus,
  WeeklyAutonomy,
} from "../../teacher-contract";

const STATUS_LABELS: Record<ConceptGapStatus, string> = {
  pending: "not studied yet",
  review: "still confused",
  understood: "understood",
};

export function statusLabel(status: ConceptGapStatus): string {
  return STATUS_LABELS[status];
}

export function formatMinutes(minutes: number[]): string {
  return minutes.length === 0 ? "—" : `min ${minutes.join(", ")}`;
}

export function formatAutonomy(autonomy: number | null): string | null {
  return autonomy === null ? null : `${Math.round(autonomy * 100)}%`;
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
