import { cn } from "@/lib/utils"
import { CheckBadge } from "./check-badge"

/** Orange circle with the step number (Loop'd is guiding you); a teal check once the step is done. */
export function StepChip({ number, done = false, className }: { number: number; done?: boolean; className?: string }) {
  if (done) return <CheckBadge size="md" className={className} />
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-orange text-[14px] font-bold text-white tabular-nums",
        className,
      )}
    >
      {number}
    </span>
  )
}
