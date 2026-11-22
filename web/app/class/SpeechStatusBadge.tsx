import type { SpeechStatus } from "./speechStatus";

type Props = { status: SpeechStatus; planBPlaying: boolean; onPlanB: () => void };

const LABEL: Record<SpeechStatus, string> = {
  live: "En direct",
  reconnecting: "Reconnexion…",
  offline: "Hors ligne · sous-titres en pause",
};

/** Live-subtitle connection; when offline, offers the prepared lesson text (plan B). */
export function SpeechStatusBadge({ status, planBPlaying, onPlanB }: Props) {
  if (planBPlaying) {
    return <p className="rounded-full bg-fill px-3 py-1 text-sm font-medium">Texte de la leçon (plan B)</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p role="status" className="inline-flex items-center gap-1.5 rounded-full bg-fill px-3 py-1 text-sm font-medium">
        <span aria-hidden className={`size-2 rounded-full ${status === "live" ? "bg-primary" : "bg-word-orange"}`} />
        {LABEL[status]}
      </p>
      {status === "offline" && (
        <button
          type="button"
          onClick={onPlanB}
          className="rounded-full border border-border bg-card px-3 py-1 text-sm font-medium hover:bg-fill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Lire le texte de la leçon
        </button>
      )}
    </div>
  );
}
