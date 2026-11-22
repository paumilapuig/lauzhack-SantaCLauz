import { TrendingUp } from "lucide-react";
import type { StudentAutonomy, WeeklyAutonomy } from "../../teacher-contract";
import { formatAutonomy, sparklinePoints } from "./dashboard-format";

const WIDTH = 240;
const HEIGHT = 72;

const weekLabel = (week: string) => week.replace(/^\d{4}-W/, "W");

/** Change in points from the first week to the last, e.g. "+27 pts in 4 weeks". */
export function autonomyGain(weekly: WeeklyAutonomy[]): string | null {
  if (weekly.length < 2) return null;
  const points = Math.round((weekly[weekly.length - 1].autonomy - weekly[0].autonomy) * 100);
  return `${points >= 0 ? "+" : ""}${points} pts in ${weekly.length} weeks`;
}

/** Stretch the weeks over the chart height (with some air), so a 10-point gain is visible, not a flat line. */
function zoomed(weekly: WeeklyAutonomy[]): WeeklyAutonomy[] {
  const values = weekly.map((w) => w.autonomy);
  const low = Math.max(0, Math.min(...values) - 0.15);
  const high = Math.min(1, Math.max(...values) + 0.05);
  return weekly.map((w) => ({ ...w, autonomy: (w.autonomy - low) / Math.max(0.01, high - low) }));
}

function AreaChart({ weekly }: { weekly: WeeklyAutonomy[] }) {
  const line = sparklinePoints(zoomed(weekly), WIDTH, HEIGHT);
  if (line === "") return null;
  const last = line.split(" ").at(-1)!.split(",").map(Number);
  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Autonomy per week: ${weekly.map((w) => `${weekLabel(w.week)} ${formatAutonomy(w.autonomy)}`).join(", ")}`} className="h-20 w-full overflow-visible">
        <polygon points={`0,${HEIGHT} ${line} ${WIDTH},${HEIGHT}`} className="fill-primary-soft" />
        <polyline points={line} fill="none" className="stroke-primary" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r={5} className="fill-primary stroke-card" strokeWidth={2} />
      </svg>
      <div aria-hidden className="flex justify-between text-[12px] text-subtle tabular-nums">
        {weekly.map((w) => (
          <span key={w.week}>{weekLabel(w.week)}</span>
        ))}
      </div>
    </div>
  );
}

/** How much of the lesson's vocabulary a student understands without help, and how it moved week after week. */
export function AutonomyCard({ student }: { student: StudentAutonomy }) {
  const figure = formatAutonomy(student.autonomy);
  const gain = autonomyGain(student.weekly);
  return (
    <article className="flex flex-col gap-4 rounded-[24px] border border-border bg-card p-5 md:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[17px] font-bold text-heading">{student.name}</h3>
          <p className="text-[13px] text-label-secondary">understands without help</p>
        </div>
        {gain && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[13px] font-bold text-primary tabular-nums">
            <TrendingUp aria-hidden className="size-3.5" strokeWidth={2.5} />
            {gain}
          </span>
        )}
      </header>
      {figure === null ? (
        <p className="text-[15px] text-label-secondary">No finished class yet.</p>
      ) : (
        <p className="text-[44px] leading-none font-bold tracking-[-0.03em] text-heading tabular-nums">{figure}</p>
      )}
      {student.weekly.length >= 2 ? <AreaChart weekly={student.weekly} /> : <p className="text-[13px] text-subtle">The trend appears after a second week.</p>}
    </article>
  );
}
