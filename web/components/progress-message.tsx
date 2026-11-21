import { BadgeCheck, Footprints, Sprout } from "lucide-react"
import type { ProgressKind, ProgressMessage as Message } from "@/lib/student-contract"
import { HAND } from "./notebook"

const ICONS = {
  learned_this_week: Sprout,
  no_help_needed: BadgeCheck,
  keep_going: Footprints,
} satisfies Record<ProgressKind, typeof Sprout>

const NOTES: Record<ProgressKind, string> = {
  learned_this_week: "esta semana",
  no_help_needed: "ya es tuya",
  keep_going: "para mañana",
}

export function ProgressMessage({ message }: { message: Message }) {
  const Icon = ICONS[message.kind]
  return (
    <article className="flex h-full flex-col gap-6 rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-accent">
          <Icon aria-hidden="true" className="size-7 text-primary" />
        </span>
        <span aria-hidden className={`text-2xl text-lost ${HAND}`}>{NOTES[message.kind]}</span>
      </div>
      <h2 className="text-2xl leading-snug font-bold">{message.text}</h2>
    </article>
  )
}
