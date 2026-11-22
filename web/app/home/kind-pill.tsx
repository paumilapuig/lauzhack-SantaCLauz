import { CircleHelp, Rewind } from "lucide-react"
import { cn } from "@/lib/utils"

const KINDS = {
  word: { label: "A word you missed", hint: "From « Je n'ai pas compris »", Icon: Rewind, className: "bg-lost-soft text-lost" },
  context: { label: "The context", hint: "An idea from class, explained step by step", Icon: CircleHelp, className: "bg-fill text-heading" },
}

/** Tells the two learning paths apart at a glance: a word (audio clip) or the context (an idea). */
export function KindPill({ kind }: { kind: keyof typeof KINDS }) {
  const { label, hint, Icon, className } = KINDS[kind]
  return (
    <span title={hint} className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold", className)}>
      <Icon aria-hidden className="size-3.5" strokeWidth={2.25} />
      {label}
    </span>
  )
}
