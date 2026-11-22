import { cn } from "@/lib/utils"

export const NO_HELP_LEVEL = 2

/** Level < 2 → help is still on (yellow); level ≥ 2 → no help needed (teal). Pops when it changes. */
export function StatusPill({ level, translation }: { level: number; translation: string }) {
  const free = level >= NO_HELP_LEVEL
  return (
    <span
      key={free ? "free" : "help"}
      className={cn(
        "inline-flex w-fit animate-pop items-center rounded-full px-3 py-1 text-[14px] font-bold",
        free ? "bg-primary-soft text-primary" : "bg-word-yellow-bg text-word-yellow",
      )}
    >
      {free ? (
        "No help needed"
      ) : (
        <>
          Help on:&nbsp;<span lang="es">{translation || "…"}</span>
        </>
      )}
    </span>
  )
}
