import { Check } from "lucide-react"
import type { ProgressDay } from "@/lib/student-contract"
import { cn } from "@/lib/utils"

const NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

/** Days in a row with practice, up to today (a day not over yet does not break it). */
export function streakUntil(week: ProgressDay[], today: string): number {
  const end = week.findIndex((d) => d.date === today)
  if (end < 0) return 0
  let streak = 0
  for (let i = end; i >= 0; i--) {
    if (week[i].practised) streak++
    else if (i !== end) break
  }
  return streak
}

/** Monday to Sunday: a teal check on each day she practised. Never a fraction of the week. */
export function WeekStrip({ week, today }: { week: ProgressDay[]; today: string }) {
  const streak = streakUntil(week, today)
  return (
    <section aria-labelledby="week-title" className="flex flex-col gap-4 rounded-[24px] border border-border bg-card p-5 md:p-7">
      <header className="flex items-baseline justify-between gap-3">
        <h2 id="week-title" className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">This week</h2>
        {streak >= 2 && <p className="rounded-full bg-brand-orange-soft px-3 py-1 text-[13px] font-bold text-heading">{streak} days in a row</p>}
      </header>
      <ol className="grid grid-cols-7 gap-1.5">
        {week.map((day, i) => {
          const isToday = day.date === today
          const future = day.date > today
          const name = NAMES[i] ?? day.date
          return (
            <li
              key={day.date}
              aria-label={`${name}${isToday ? ", today" : ""}${day.practised ? ": practised" : ""}`}
              style={{ "--i": i } as React.CSSProperties}
              className="flex animate-pop flex-col items-center gap-2"
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 md:size-12",
                  day.practised && "border-primary bg-primary text-primary-foreground",
                  !day.practised && isToday && "border-heading border-dashed",
                  !day.practised && !isToday && (future ? "border-separator" : "border-input"),
                )}
              >
                {day.practised && <Check aria-hidden className="size-5" strokeWidth={3} />}
              </span>
              <span className={cn("text-[13px] font-semibold", isToday ? "text-heading" : "text-label-secondary")}>{name.slice(0, 3)}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
