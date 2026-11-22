import { CheckBadge } from "@/components/ui/check-badge"
import { LevelMeter } from "@/components/ui/level-meter"
import { LevelUpBanner } from "@/components/ui/level-up-banner"
import { NO_HELP_LEVEL } from "@/components/ui/status-pill"
import { ActionButton } from "./exercises/controls"

const BANNER_STEPS = 5

export type PracticeOutcome = { lemma: string; translation: string; level: number; leveledUp: boolean }
export type PracticeSummaryData = { outcomes: PracticeOutcome[]; others: string[] }

/** After a game: what Loop'd now knows about each word. A word that no longer needs help gets the banner. */
export function PracticeSummary({ summary, onBack }: { summary: PracticeSummaryData | null; onBack: () => void }) {
  if (summary === null) return <p className="py-10 text-[17px] text-label-secondary">Saving…</p>
  const freed = summary.outcomes.find((o) => o.leveledUp && o.level >= NO_HELP_LEVEL)
  return (
    <div className="flex flex-col gap-6">
      {freed ? (
        <LevelUpBanner word={freed.lemma} />
      ) : (
        <div className="flex items-center gap-3">
          <CheckBadge size="lg" />
          <p className="text-[24px] font-bold tracking-[-0.01em] text-heading">Nice work.</p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {summary.outcomes.map((o, i) => (
          // the banner is the moment: the meters wait (+500 ms) until it has landed
          <LevelMeter key={o.lemma} index={freed ? i + BANNER_STEPS : i} word={o.lemma} translation={o.translation} level={o.level} gained={o.leveledUp} />
        ))}
      </div>
      {summary.others.length > 0 && (
        <p className="text-[16px] text-label-secondary">
          Also practised: <span lang="fr" className="font-bold text-heading">{summary.others.join(", ")}</span>
        </p>
      )}
      <ActionButton onClick={onBack} className="self-start">
        Back
      </ActionButton>
    </div>
  )
}
