import type { LostPeak } from "../../teacher-contract";
import { peakBars } from "./dashboard-format";

export function LostPeaksSection({ peaks }: { peaks: LostPeak[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-bold">Moments difficiles</h3>
      {peaks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Personne ne s&apos;est perdu pendant cette leçon.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {peakBars(peaks).map(({ minute, count, widthPct, isMax }) => (
            <li
              key={minute}
              className={`flex items-center gap-3 text-sm ${isMax ? "font-bold" : ""}`}
            >
              <span className="w-16 shrink-0">min {minute}</span>
              <div className="h-3 flex-1 rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-lost"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
