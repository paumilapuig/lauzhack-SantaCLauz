import { BadgeCheck, Footprints, Sprout } from "lucide-react"
import type { ProgressKind, ProgressMessage as Message } from "@/lib/student-contract"

const ICONS = {
  learned_this_week: Sprout,
  no_help_needed: BadgeCheck,
  keep_going: Footprints,
} satisfies Record<ProgressKind, typeof Sprout>

// A plain row: line icon + sentence
export function ProgressMessage({ message }: { message: Message }) {
  const Icon = ICONS[message.kind]
  return (
    <article className="flex h-14 items-center gap-3">
      <Icon aria-hidden="true" strokeWidth={1.5} className="size-[18px] shrink-0 text-label-secondary" />
      <h2 className="text-[17px] leading-[24px] font-normal">{message.text}</h2>
    </article>
  )
}
