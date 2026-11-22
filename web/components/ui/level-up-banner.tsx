import { CheckBadge } from "./check-badge"

/** The big moment of /home: a word no longer needs help. Nothing else moves while it enters. */
export function LevelUpBanner({ word }: { word: string }) {
  return (
    <div role="status" className="flex animate-pop items-center gap-4 rounded-[24px] bg-primary p-6 text-primary-foreground md:p-8">
      <CheckBadge size="lg" tone="white" />
      <p className="text-[20px] leading-snug font-bold md:text-[24px]">
        You no longer need
        <br />
        help with <span lang="fr">{word}</span>
      </p>
    </div>
  )
}
