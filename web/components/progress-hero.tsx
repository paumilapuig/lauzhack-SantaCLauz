import type { ProgressMessage } from "@/lib/student-contract"

// The week's figure (a count of words learned, never a percentage) set large, Apple-summary style
export function ProgressHero({ message }: { message: ProgressMessage }) {
  const figure = message.text.match(/\d+/)?.[0]
  return (
    <section className="flex flex-col gap-3 border-b border-separator pb-12">
      <p className="text-[13px] leading-[18px] font-semibold text-primary">Esta semana</p>
      {figure && (
        <p aria-hidden className="text-[96px] leading-none font-bold tracking-[-0.04em] tabular-nums md:text-[120px]">
          {figure}
        </p>
      )}
      <h2 className="max-w-[18em] text-balance text-[22px] leading-[28px] font-bold">{message.text}</h2>
    </section>
  )
}
