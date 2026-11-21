import type { ProgressMessage } from "@/lib/student-contract"

// The week's figure (a count of words learned, never a percentage) set large, Apple-summary style
export function ProgressHero({ message }: { message: ProgressMessage }) {
  const figure = message.text.match(/\d+/)?.[0]
  return (
    <section className="flex flex-col gap-3 border-b border-separator pb-12">
      <p className="text-[17px] font-semibold text-primary">Esta semana</p>
      {figure && (
        <p aria-hidden className="text-[112px] leading-[0.95] font-semibold tracking-[-0.045em] tabular-nums md:text-[160px]">
          {figure}
        </p>
      )}
      <h2 className="max-w-[18em] text-balance text-[24px] leading-snug font-semibold tracking-[-0.015em] md:text-[28px]">{message.text}</h2>
    </section>
  )
}
