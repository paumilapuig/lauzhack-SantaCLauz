import { BadgeCheck, Footprints, Sprout } from "lucide-react"
import type { ProgressKind, ProgressMessage as Message } from "@/lib/student-contract"

const ICONS = {
  learned_this_week: Sprout,
  no_help_needed: BadgeCheck,
  keep_going: Footprints,
} satisfies Record<ProgressKind, typeof Sprout>

export function ProgressMessage({ message }: { message: Message }) {
  const Icon = ICONS[message.kind]
  return (
    <article className="flex min-h-14 items-center gap-3 py-2">
      <Icon aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0 text-label-secondary" />
      <h2 className="text-[17px] leading-6 font-medium text-foreground">{message.text}</h2>
    </article>
  )
}
