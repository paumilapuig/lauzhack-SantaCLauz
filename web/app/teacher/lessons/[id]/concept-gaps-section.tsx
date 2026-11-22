import type { ConceptGapRow } from "../../teacher-contract";
import { formatMinutes, statusLabelFr } from "./dashboard-format";

export function ConceptGapsSection({ gaps }: { gaps: ConceptGapRow[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-bold">Concepts to review</h3>
      {gaps.length === 0 ? (
        <p className="text-sm text-muted-foreground">No concepts to review.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {gaps.map(({ student, concept, minutes, status }) => (
            <li
              key={`${student}-${concept}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
            >
              <span className="font-bold">{student}</span>
              <span>{concept}</span>
              <span className="text-muted-foreground">{formatMinutes(minutes)}</span>
              <span className="rounded-full border border-border bg-muted px-3 py-0.5 text-sm">
                {statusLabelFr(status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
