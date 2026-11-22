import type { LostPeak, TeacherDashboard } from "../../teacher-contract";
import { formatAutonomy } from "./dashboard-format";

const MAX_INSIGHTS = 3;
const MIN_PEAK_COUNT = 2;
const MIN_WORD_TAPS = 3;

function studentSentences({ students }: TeacherDashboard): string[] {
  return students
    .filter((student) => student.weekly.length >= 2)
    .map(({ name, weekly }) => {
      const first = formatAutonomy(weekly[0].autonomy);
      const last = formatAutonomy(weekly[weekly.length - 1].autonomy);
      return `${name}: autonomy ${first} → ${last} over ${weekly.length} weeks.`;
    });
}

function strongestPeak(peaks: LostPeak[]): LostPeak | undefined {
  return peaks.reduce<LostPeak | undefined>(
    (best, peak) =>
      !best ||
      peak.count > best.count ||
      (peak.count === best.count && peak.minute < best.minute)
        ? peak
        : best,
    undefined,
  );
}

function peakSentences(data: TeacherDashboard): string[] {
  const peak = strongestPeak(data.lost_peaks);
  if (!peak || peak.count < MIN_PEAK_COUNT) return [];
  const gap = data.concept_gaps.find((row) => row.minutes.includes(peak.minute));
  const guess = gap ? ` — probably "${gap.concept}"` : "";
  return [
    `Minute ${peak.minute}: ${peak.count} "I lost the thread" reports${guess}.`,
  ];
}

function wordSentences({ top_words }: TeacherDashboard): string[] {
  const top = top_words[0];
  if (!top || top.taps < MIN_WORD_TAPS) return [];
  return [`"${top.lemma}" was marked ${top.taps} times.`];
}

export function insights(dashboard: TeacherDashboard): string[] {
  return [
    ...studentSentences(dashboard),
    ...peakSentences(dashboard),
    ...wordSentences(dashboard),
  ].slice(0, MAX_INSIGHTS);
}
