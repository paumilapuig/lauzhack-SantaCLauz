import type { ConceptGapRow, LostPeak } from "../../teacher-contract";
import styles from "./dashboard.module.css";
import { classTimeline, hardestMinutes, signals, type MinuteColumn } from "./timeline";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const describe = (c: MinuteColumn) =>
  [c.lost > 0 && plural(c.lost, "lost the thread", "lost the thread"), c.unclear > 0 && plural(c.unclear, "word not understood", "words not understood")]
    .filter(Boolean)
    .join(" · ");

function Column({ column, max, peak }: { column: MinuteColumn; max: number; peak: boolean }) {
  const height = (n: number) => `${(n / max) * 100}%`;
  const label = signals(column) > 0 ? `Minute ${column.minute}: ${describe(column)}` : `Minute ${column.minute}: quiet`;
  return (
    <li aria-label={label} tabIndex={signals(column) > 0 ? 0 : -1} className="group relative flex h-full flex-1 flex-col justify-end outline-none">
      {signals(column) > 0 && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max max-w-56 -translate-x-1/2 rounded-[10px] bg-heading px-3 py-2 text-[13px] leading-snug text-primary-foreground group-hover:block group-focus-visible:block"
        >
          <span className="font-bold">min {column.minute}</span> · {describe(column)}
        </span>
      )}
      <span
        className={`mx-auto flex w-full max-w-7 flex-col justify-end overflow-hidden rounded-t-[6px] ${styles.grow}`}
        style={{ height: height(signals(column)), "--i": column.minute } as React.CSSProperties}
      >
        <span className="bg-brand-orange" style={{ height: `${(column.unclear / Math.max(1, signals(column))) * 100}%` }} />
        <span className="bg-lost" style={{ height: `${(column.lost / Math.max(1, signals(column))) * 100}%` }} />
      </span>
      {peak && <span aria-hidden className="absolute inset-x-0 -bottom-1 mx-auto h-1 w-3 rounded-full bg-heading" />}
    </li>
  );
}

/** The lesson minute by minute: when students lost the thread (navy) or missed a word (orange), and why. */
export function ClassTimeline({ lost, unclear, gaps }: { lost: LostPeak[]; unclear: LostPeak[]; gaps: ConceptGapRow[] }) {
  const columns = classTimeline(lost, unclear, gaps);
  const hardest = hardestMinutes(columns, 2);
  const max = Math.max(1, ...columns.map(signals));
  const peakSet = new Set(hardest.map((c) => c.minute));
  return (
    <section aria-labelledby="timeline-title" className="flex flex-col gap-6 rounded-[24px] border border-border bg-card p-5 md:p-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">Where the class got hard</p>
          <h2 id="timeline-title" className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-heading">
            {hardest[0] ? `Minute ${hardest[0].minute} was the hardest moment` : "Nobody got lost in this lesson"}
          </h2>
        </div>
        <ul className="flex flex-wrap gap-4 text-[14px] text-label-secondary">
          <li className="flex items-center gap-2"><span aria-hidden className="size-3 rounded-[3px] bg-lost" />«J&apos;ai perdu le fil»</li>
          <li className="flex items-center gap-2"><span aria-hidden className="size-3 rounded-[3px] bg-brand-orange" />«Je n&apos;ai pas compris»</li>
        </ul>
      </header>

      <div className="flex flex-col gap-2">
        <ol aria-label="Signals per minute" className="flex h-48 items-end gap-1 border-b border-border pb-1">
          {columns.map((column) => (
            <Column key={column.minute} column={column} max={max} peak={peakSet.has(column.minute)} />
          ))}
        </ol>
        <div aria-hidden className="flex gap-1 text-[12px] text-subtle tabular-nums">
          {columns.map((c) => (
            <span key={c.minute} className="flex-1 text-center">{c.minute % 5 === 0 ? c.minute : ""}</span>
          ))}
        </div>
        <p className="text-right text-[12px] text-subtle">minutes since the class started</p>
      </div>

      {hardest.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2">
          {hardest.map((c) => (
            <li key={c.minute} className="flex flex-col gap-2 rounded-[16px] bg-fill p-4">
              <p className="flex items-baseline gap-2">
                <span className="shrink-0 rounded-full bg-heading px-2.5 py-0.5 text-[13px] font-bold whitespace-nowrap text-primary-foreground tabular-nums">min {c.minute}</span>
                <span className="text-[14px] text-label-secondary">{describe(c)}</span>
              </p>
              {c.concepts.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {c.concepts.map((concept) => (
                    <li key={concept} lang="fr" className="text-[16px] font-bold text-heading">{concept}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[15px] text-label-secondary">No idea was flagged here. Check the words they marked.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
