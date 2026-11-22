import type { ProgressMessage } from "@/lib/student-contract"

export function ProgressHero({ message }: { message: ProgressMessage }) {
  const figure = message.text.match(/\d+/)?.[0]
  return (
    <section className="flex flex-col gap-4 pb-4">
      {figure && (
        <p
          aria-hidden
          className="font-heading text-[72px] leading-[1.1] font-bold tracking-[-2.16px] tabular-nums text-heading md:text-[88px]"
        >
          {figure}
        </p>
      )}
      <h2 className="max-w-[24em] text-balance text-[20px] leading-[1.33] font-medium tracking-[-0.5px] text-foreground">
        {message.text}
      </h2>
    </section>
  )
}
