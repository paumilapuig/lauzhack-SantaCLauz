"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import type { ConceptGap } from "@/lib/student-contract"
import { CheckBadge } from "@/components/ui/check-badge"
import { useTodayLabel } from "@/components/page-title"
import { StudentPage } from "@/components/student-page"
import { ClipReviewItem } from "./clip-review-item"
import { ConceptsSection } from "./concepts-section"
import { PracticeDialog } from "./practice-dialog"
import { PRACTICE_MODES } from "./practice-modes"
import { PracticeModesGrid } from "./practice-modes-grid"
import { PracticeModesList, type PracticeModeItem } from "./practice-modes-list"
import { panelId, ReviewSwitch, tabId, type ReviewView } from "./review-switch"
import { StudyPlan } from "./study-plan-view"
import { buildStudyPlan, conceptStep, gamesPlayed, practiceDone } from "./study-plan"
import { suggestedGame } from "./suggested-game"
import { prepareTranslator } from "./translate/browser-translator"
import { Translatable } from "./translate/translatable"
import { usableWords } from "./usable-words"
import { useHomeReview } from "./use-home-review"
import { useCompletedSteps } from "./use-completed-steps"

const SECTION_TITLE = "text-[13px] font-bold tracking-[0.06em] text-subtle uppercase"

const LEAD = "Here is today's work. Vocab: the words you missed. Context: the ideas you lost."

const HINT: Record<ReviewView, (clipsLeft: number) => string> = {
  vocab: (clipsLeft) =>
    clipsLeft > 0 ? "Listen to the class again. Tap every word you didn't understand, then press Done." : "Your clips are done. Time to play with your words.",
  context: () => "Ideas from class, explained step by step. Then two quick questions.",
}

/** Spanish from the concept's own glossary, only for an exact entry ("respiration" is not "respiration cellulaire"). */
const exactGloss = (text: string, concepts: ConceptGap[]) =>
  concepts.flatMap((c) => c.explanation.flatMap((step) => step.words ?? [])).find((w) => w.fr.toLocaleLowerCase("fr") === text)?.es ?? null

const scrollToSwitch = () => document.getElementById("review-switch")?.scrollIntoView({ behavior: "smooth", block: "start" })

function EmptyContext() {
  return (
    <div className="flex animate-rise items-center gap-4 rounded-[24px] border border-border bg-card p-6">
      <CheckBadge size="lg" />
      <div>
        <p className="text-[19px] font-bold text-heading">Nothing to untangle right now.</p>
        <p className="text-[16px] text-label-secondary">Ideas from class you want to understand better show up here.</p>
      </div>
    </div>
  )
}

export function HomeReview() {
  const home = useHomeReview()
  const { review, marks, words, concepts, failed } = home
  const [view, setView] = useState<ReviewView>("vocab")
  const [openMode, setOpenMode] = useState<string | null>(null)
  const { completed, markDone } = useCompletedSteps()
  const played = gamesPlayed(completed)
  const today = useTodayLabel()

  const mode = PRACTICE_MODES.find((m) => m.id === openMode)
  const wordCount = (m: PracticeModeItem) => usableWords(words, m.needs).length
  const isAvailable = (id: string) => {
    const m = PRACTICE_MODES.find((candidate) => candidate.id === id)
    return !!m && wordCount(m) >= m.minWords
  }

  const pending = review?.clips ?? []
  const suggested = review ? (suggestedGame(review.words_to_practice, isAvailable, played) ?? undefined) : undefined
  const practice = { modes: PRACTICE_MODES, wordCount, suggested, played, onOpen: setOpenMode }

  const plan = review
    ? buildStudyPlan({ clips: pending, concepts, words: review.words_to_practice, isAvailable, completed })
    : []

  // the moment the last step of the day is checked off (not when she opens a finished day)
  const todoLeft = plan.filter((step) => !step.done).length
  const lastTodo = useRef<number | null>(null)
  useEffect(() => {
    if (!review) return
    if (lastTodo.current !== null && lastTodo.current > 0 && todoLeft === 0) toast.success("Well done! Today's work is finished.")
    lastTodo.current = todoLeft
  }, [review, todoLeft])

  // opening Context is a click: Chrome may download its French model now, before she taps a word
  function changeView(next: ReviewView) {
    if (next === "context") prepareTranslator()
    setView(next)
  }

  function show(next: ReviewView) {
    changeView(next)
    scrollToSwitch()
  }

  function closeMode(practised: boolean) {
    if (practised && openMode && review) markDone(practiceDone(openMode, review.words_to_practice))
    setOpenMode(null)
    if (practised) home.refresh().catch((error) => console.error(error))
  }

  /** Closing the last clip checks the clips step off. */
  async function closeClip(close: (clipId: string) => Promise<void>, clipId: string) {
    const last = pending.length === 1
    await close(clipId)
    if (last) markDone({ kind: "clips", count: 1, minutes: 1 })
  }

  function understood(conceptId: string) {
    const gap = concepts.find((c) => c.id === conceptId)
    if (gap) markDone(conceptStep(gap))
    home.conceptUnderstood(conceptId)
  }

  return (
    <StudentPage title="Review" context={today} lead={LEAD} wide>
      {failed ? (
        <p role="alert" className="text-[19px]">Your clips could not be loaded. Is the server running?</p>
      ) : !review ? (
        <p className="text-[19px] text-label-secondary">Loading…</p>
      ) : (
        <div className="flex flex-col gap-10">
          <StudyPlan steps={plan} modes={PRACTICE_MODES} onClips={() => show("vocab")} onConcept={() => show("context")} onPractice={setOpenMode} />

          <div id="review-switch" className="flex scroll-mt-24 flex-col gap-4">
            <ReviewSwitch value={view} counts={{ vocab: pending.length, context: concepts.length }} onChange={changeView} />
            <p className="text-[16px] text-label-secondary">{HINT[view](pending.length)}</p>
          </div>

          <div role="tabpanel" id={panelId(view)} aria-labelledby={tabId(view)} key={view} className="animate-rise">
            {view === "context" ? (
              concepts.length > 0 ? (
                <Translatable known={(text) => exactGloss(text, concepts)}>
                  <ConceptsSection concepts={concepts} onAnswer={home.answerConcept} onUnderstood={understood} onTapWord={home.tapConceptWord} />
                </Translatable>
              ) : (
                <EmptyContext />
              )
            ) : pending.length > 0 ? (
              <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
                <section aria-label="Clips to review" className="flex min-w-0 flex-col gap-10">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className={SECTION_TITLE}>From class</h2>
                    <p className="text-[14px] font-medium tabular-nums text-label-secondary">{pending.length} to review</p>
                  </div>
                  {pending.map((clip, index) => (
                    <ClipReviewItem
                      key={clip.id}
                      clip={clip}
                      index={index}
                      marks={marks[clip.id] ?? {}}
                      onToggle={(word) => home.toggle(clip.id, word)}
                      onDone={(id) => closeClip(home.finishClip, id)}
                      onDiscard={(id) => closeClip(home.discardClip, id)}
                    />
                  ))}
                </section>

                <aside aria-label="Practice" className="lg:sticky lg:top-24">
                  <div className="rounded-[24px] border border-border bg-card p-4">
                    <h2 className={`mb-2 px-2 pt-1 ${SECTION_TITLE}`}>Practice</h2>
                    <PracticeModesList {...practice} />
                  </div>
                </aside>
              </div>
            ) : (
              <section aria-label="Practice" className="flex flex-col gap-4">
                <h2 className={SECTION_TITLE}>Practice</h2>
                <PracticeModesGrid {...practice} />
              </section>
            )}
          </div>
        </div>
      )}

      <PracticeDialog
        mode={mode}
        words={mode ? usableWords(words, mode.needs) : []}
        onSave={home.savePractice}
        onClose={closeMode}
      />
    </StudentPage>
  )
}
