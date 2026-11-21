import { BadgeCheck, Footprints, Sprout } from "lucide-react"
import type { ProgressKind, ProgressMessage as Message } from "@/lib/student-contract"

const ICONS = {
  learned_this_week: Sprout,
  no_help_needed: BadgeCheck,
  keep_going: Footprints,
} satisfies Record<ProgressKind, typeof Sprout>

// A row with a Settings-style icon tile
export function ProgressMessage({ message }: { message: Message }) {
  const Icon = ICONS[message.kind]
  return (
    <article className="flex items-center gap-4 py-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary">
        <Icon aria-hidden="true" className="size-[22px] text-primary-foreground" />
      </span>
      <h2 className="text-[19px] leading-snug font-semibold tracking-[-0.01em]">{message.text}</h2>
    </article>
  )
}
