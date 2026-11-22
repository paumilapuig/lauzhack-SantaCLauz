import type { ProgressWord } from "@/lib/student-contract"
import { cn } from "@/lib/utils"
import { Plant } from "./plant"

const NO_HELP_LEVEL = 2
const STAGE = ["a seed", "a sprout", "in leaf", "in flower"]

const label = (w: ProgressWord) => `${w.lemma}${w.translation_es ? `, ${w.translation_es}` : ""}: ${STAGE[Math.min(Math.max(w.level, 0), 3)]}`

function Bed({ title, hint, words, grown, offset }: { title: string; hint: string; words: ProgressWord[]; grown: boolean; offset: number }) {
  if (words.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h3 className={cn("text-[15px] font-bold", grown ? "text-primary" : "text-brand-orange")}>{title}</h3>
        <p className="text-[14px] text-label-secondary">{hint}</p>
      </div>
      <ul aria-label={title} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {words.map((word, i) => (
          <li
            key={word.lemma}
            aria-label={label(word)}
            style={{ "--i": offset + i } as React.CSSProperties}
            className={cn(
              "flex animate-rise flex-col items-center gap-1 rounded-[16px] border px-3 pt-3 pb-4 text-center",
              grown ? "border-primary/15 bg-primary-soft" : "border-border bg-card",
            )}
          >
            <Plant level={word.level} index={offset + i} />
            <span lang="fr" className="text-[17px] leading-tight font-bold text-heading">{word.lemma}</span>
            {word.translation_es && (
              <span lang="es" className={cn("text-[14px] font-semibold", grown ? "text-primary" : "text-word-yellow")}>
                {word.translation_es}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Every word she met, as a plant that grows with her level: no number, no total.
 * Flowers first (what she no longer needs help with), then what is still growing.
 */
export function WordGarden({ words }: { words: ProgressWord[] }) {
  const byLevel = (a: ProgressWord, b: ProgressWord) => b.level - a.level
  const grown = words.filter((w) => w.level >= NO_HELP_LEVEL).sort(byLevel)
  const growing = words.filter((w) => w.level < NO_HELP_LEVEL).sort(byLevel)
  return (
    <section aria-labelledby="garden-title" className="flex flex-col gap-6 rounded-[24px] border border-border bg-card p-5 md:p-7">
      <header className="flex flex-col gap-1">
        <p className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">Your word garden</p>
        <h2 id="garden-title" className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-heading">
          Every word you met grows a little each time you practise
        </h2>
      </header>
      {words.length === 0 ? (
        <p className="text-[16px] text-label-secondary">Mark a word you don&apos;t understand in a clip: it becomes your first seed.</p>
      ) : (
        <>
          <Bed title="No help needed" hint="In leaf or in flower" words={grown} grown offset={0} />
          <Bed title="Still growing" hint="Practise to make them grow" words={growing} grown={false} offset={grown.length} />
        </>
      )}
    </section>
  )
}
