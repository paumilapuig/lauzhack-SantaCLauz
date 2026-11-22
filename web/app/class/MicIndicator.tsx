import { Mic } from "lucide-react";
import type { MicLevel } from "./micLevel";

const LABEL: Record<MicLevel, string> = {
  quiet: "Son faible · rapproche-toi",
  good: "Son : bon",
  loud: "Trop fort · éloigne-toi un peu",
};

const TONE: Record<MicLevel, string> = {
  quiet: "bg-sunbeam text-charcoal",
  good: "bg-fill text-label",
  loud: "bg-sunbeam text-charcoal",
};

/** Recording quality for the student: can the microphone hear the teacher well? */
export function MicIndicator({ level }: { level: MicLevel }) {
  return (
    <p role="status" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${TONE[level]}`}>
      <Mic className="size-4" strokeWidth={1.75} aria-hidden />
      {LABEL[level]}
    </p>
  );
}
