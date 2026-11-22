import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConceptGapRow, ConceptGapStatus } from "../../teacher-contract";
import { formatMinutes, statusLabel } from "./dashboard-format";

const PILL: Record<ConceptGapStatus, string> = {
  review: "bg-brand-orange-soft text-heading",
  pending: "bg-fill text-label-secondary",
  understood: "bg-primary-soft text-primary",
};

const initial = (name: string) => (name.match(/\p{L}/u)?.[0] ?? "?").toUpperCase();

function Row({ gap }: { gap: ConceptGapRow }) {
  return (
    <li className="flex flex-col gap-2 border-t border-separator py-4 first:border-t-0 first:pt-0">
      <p lang="fr" className={cn("text-[16px] leading-snug font-bold", gap.status === "understood" ? "text-label-secondary" : "text-heading")}>
        {gap.concept}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border py-0.5 pr-2.5 pl-0.5 font-medium">
          <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-lost text-[10px] font-bold text-white">{initial(gap.student)}</span>
          {gap.student}
        </span>
        <span className="text-label-secondary tabular-nums">{formatMinutes(gap.minutes)}</span>
        {gap.attempts > 0 && <span className="text-label-secondary">{gap.attempts === 1 ? "1 try" : `${gap.attempts} tries`}</span>}
        <span className={cn("ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold", PILL[gap.status])}>
          {gap.status === "understood" && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
          {statusLabel(gap.status)}
        </span>
      </div>
    </li>
  );
}

/** Ideas students lost in class: the ones still to explain first, then the ones they have understood at home. */
export function ConceptsToRevisit({ gaps }: { gaps: ConceptGapRow[] }) {
  const open = gaps.filter((g) => g.status !== "understood");
  const done = gaps.filter((g) => g.status === "understood");
  return (
    <section aria-labelledby="concepts-title" className="flex flex-col gap-5 rounded-[24px] border border-border bg-card p-5 md:p-7">
      <header className="flex flex-col gap-1">
        <p className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">For the next class</p>
        <h2 id="concepts-title" className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-heading">
          {open.length > 0 ? "Ideas to explain again" : "Every lost idea is understood"}
        </h2>
      </header>
      {gaps.length === 0 ? (
        <p className="text-[15px] text-label-secondary">Nobody pressed «J&apos;ai perdu le fil» in this lesson yet.</p>
      ) : (
        <>
          {open.length > 0 && <ul className="flex flex-col">{open.map((gap) => <Row key={`${gap.student}-${gap.concept}`} gap={gap} />)}</ul>}
          {done.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-bold text-primary">Understood at home</h3>
              <ul className="flex flex-col">{done.map((gap) => <Row key={`${gap.student}-${gap.concept}`} gap={gap} />)}</ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
