/** The 2–3 things to know before the next class, in one dark card at the top. */
export function KeyPoints({ sentences }: { sentences: string[] }) {
  if (sentences.length === 0) return null;
  return (
    <section aria-labelledby="key-points" className="flex flex-col gap-4 rounded-[24px] bg-heading p-5 text-primary-foreground md:p-7">
      <h2 id="key-points" className="text-[12px] font-bold tracking-[0.06em] uppercase opacity-70">Key points</h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {sentences.map((sentence, i) => (
          <li key={sentence} style={{ "--i": i } as React.CSSProperties} className="flex animate-rise gap-3">
            <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-orange text-[14px] font-bold">{i + 1}</span>
            <p className="text-[16px] leading-snug">{sentence}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
