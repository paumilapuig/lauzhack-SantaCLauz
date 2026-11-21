import { Sprout } from "lucide-react"
import type { ProgressMessage } from "@/lib/student-contract"
import { HAND, Highlight } from "./notebook"

// The figure (e.g. "12" new words) set large; a count of words learned, never a percentage
export function ProgressHero({ message }: { message: ProgressMessage }) {
  const figure = message.text.match(/\d+/)?.[0]
  return (
    <article className="relative grid overflow-hidden rounded-3xl bg-foreground p-8 text-background md:grid-cols-[1fr_auto] md:items-center md:gap-10 md:p-12">
      <div className="flex flex-col gap-4">
        <p className={`text-3xl text-marker ${HAND}`}>esta semana</p>
        {figure && (
          <p aria-hidden className="text-[120px] leading-none font-bold tabular-nums md:text-[160px]">
            <Highlight strong>
              {figure}
            </Highlight>
          </p>
        )}
        <h2 className="max-w-md text-[28px] leading-snug font-bold">{message.text}</h2>
      </div>
      <div aria-hidden className="hidden size-56 items-center justify-center rounded-full bg-background/5 md:flex">
        <div className="flex size-40 items-center justify-center rounded-full bg-background/10">
          <div className="flex size-24 items-center justify-center rounded-full bg-marker-strong text-foreground">
            <Sprout className="size-12" strokeWidth={1.75} />
          </div>
        </div>
      </div>
    </article>
  )
}
