import { BadgeCheck, Footprints, Sprout } from "lucide-react"
import type { ProgressKind, ProgressMessage as Message } from "@/lib/student-contract"
import { Card } from "./ui/card"

const ICONS = {
  learned_this_week: Sprout,
  no_help_needed: BadgeCheck,
  keep_going: Footprints,
} satisfies Record<ProgressKind, typeof Sprout>

export function ProgressMessage({ message }: { message: Message }) {
  const Icon = ICONS[message.kind]
  return (
    <Card className="flex-row items-center gap-4 px-(--card-spacing)">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent">
        <Icon aria-hidden="true" className="size-8 text-primary" />
      </span>
      <h2 className="text-xl font-semibold">{message.text}</h2>
    </Card>
  )
}
