import { CheckBadge } from "@/components/ui/check-badge"

/** On a game card: "For you" when Loop'd recommends it, a check once it was played today. */
export function ModeTag({ suggested, played }: { suggested: boolean; played: boolean }) {
  if (played)
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft py-0.5 pr-2.5 pl-0.5 text-[12px] font-bold text-primary">
        <CheckBadge size="sm" />
        Done today
      </span>
    )
  if (!suggested) return null
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-brand-orange-soft px-2.5 py-0.5 text-[12px] font-bold text-heading">
      For you
    </span>
  )
}
