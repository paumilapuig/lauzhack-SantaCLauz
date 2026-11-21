import type { ProgressMessage } from "@/lib/student-contract"

// The week's figure (a count of words learned, never a percentage) set large, Apple-summary style
export function ProgressHero({ message }: { message: ProgressMessage }) {
  const figure = message.text.match(/\d+/)?.[0]
  return (
    <section className="flex flex-col gap-3 pb-12">
      {figure && (
        <p aria-hidden className="font-mono text-[88px] leading-none font-medium tracking-[-0.03em] tabular-nums md:text-[120px]">
          {figure}
        </p>
      )}
      <h2 className="max-w-[24em] text-balance text-[20px] leading-[28px] font-normal">{message.text}</h2>
    </section>
  )
}
