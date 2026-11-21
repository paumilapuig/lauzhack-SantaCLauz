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
    <article className="flex min-h-11 items-center gap-3 py-2.5">
      <span className="flex size-[29px] shrink-0 items-center justify-center rounded-[7px] bg-primary">
        <Icon aria-hidden="true" className="size-[18px] text-primary-foreground" />
      </span>
      <h2 className="text-[17px] leading-[22px] font-normal">{message.text}</h2>
    </article>
  )
}
