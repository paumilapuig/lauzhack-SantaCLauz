"use client"

import { useState } from "react"
import { useTodayLabel } from "@/components/page-title"
import { StudentPage } from "@/components/student-page"
import { ClipReviewItem } from "./clip-review-item"
import { ConceptsSection } from "./concepts-section"
import { PracticeDialog } from "./practice-dialog"
import { PRACTICE_MODES } from "./practice-modes"
import { PracticeModesGrid } from "./practice-modes-grid"
import { PracticeModesList, type PracticeModeItem } from "./practice-modes-list"
import { buildStudyPlan, type PlanStep } from "./study-plan"
import { StudyPlan } from "./study-plan-view"
import { usableWords } from "./usable-words"
import { useCompletedSteps } from "./use-completed-steps"
import { useHomeReview } from "./use-home-review"

const SECTION_TITLE = "text-[13px] font-bold tracking-[0.06em] text-subtle uppercase"

function scrollToId(id: string) {
  const reduce = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
}

export function HomeReview() {
  const home = useHomeReview()
  const { review, marks, words, concepts, failed } = home
  const [openMode, setOpenMode] = useState<string | null>(null)
  const { completed, markDone } = useCompletedSteps()
  const today = useTodayLabel()

  const mode = PRACTICE_MODES.find((m) => m.id === openMode)
  const wordCount = (m: PracticeModeItem) => usableWords(words, m.needs).length
  const isAvailable = (id: string) => {
    const m = PRACTICE_MODES.find((candidate) => candidate.id === id)
    return !!m && wordCount(m) >= m.minWords
  }

  const pending = review?.clips ?? []
  const plan = review ? buildStudyPlan({ clips: pending, concepts, words: review.words_to_practice, isAvailable, completed }) : []
  const suggested = plan.find((step) => step.kind === "practice" && !step.done)?.modeId
  const planned = (kind: PlanStep["kind"], match: (step: PlanStep) => boolean = () => true) =>
    plan.find((step) => step.kind === kind && !step.done && match(step))

  function closeMode(practised: boolean) {
    if (practised && openMode) {
      const step = planned("practice", (s) => s.kind === "practice" && s.modeId === openMode)
      markDone(step ?? { kind: "practice", modeId: openMode, words: [], minutes: 2 })
    }
    setOpenMode(null)
    if (practised) home.refresh().catch((error) => console.error(error))
  }

  // the clips step is done when the last pending clip is closed (Done or Discard)
  const closeClip = (action: (clipId: string) => Promise<void>) => async (clipId: string) => {
    const clipsStep = planned("clips")
    await action(clipId)
    if (pending.length === 1 && clipsStep) markDone(clipsStep)
  }

  function conceptUnderstood(conceptId: string) {
    const step = planned("concept", (s) => s.kind === "concept" && s.id === conceptId)
    if (step) markDone(step)
    home.conceptUnderstood(conceptId)
  }

  return (
    <StudentPage
      title="Review"
      context={today}
      lead={pending.length > 0 ? "Follow your plan. Start with the clips from class." : "Your clips are done. Keep your words fresh."}
      wide
    >
      {failed ? (
        <p role="alert" className="text-[19px]">Your clips could not be loaded. Is the server running?</p>
      ) : !review ? (
        <p className="text-[19px] text-label-secondary">Loading…</p>
      ) : (
        <div className="flex flex-col gap-14">
          <StudyPlan
            steps={plan}
            modes={PRACTICE_MODES}
            onClips={() => scrollToId("clips")}
            onConcept={(id) => scrollToId(`concept-${id}`)}
            onPractice={setOpenMode}
          />

          {pending.length > 0 && (
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
              <section id="clips" aria-label="Clips to review" className="flex min-w-0 scroll-mt-24 flex-col gap-10">
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
                    onDone={closeClip(home.finishClip)}
                    onDiscard={closeClip(home.discardClip)}
                  />
                ))}
              </section>

              <aside aria-label="Practice" className="lg:sticky lg:top-24">
                <div className="rounded-[24px] border border-border bg-card p-4">
                  <h2 className={`mb-2 px-2 pt-1 ${SECTION_TITLE}`}>Practice</h2>
                  <PracticeModesList modes={PRACTICE_MODES} wordCount={wordCount} suggested={suggested} onOpen={setOpenMode} />
                </div>
              </aside>
            </div>
          )}

          <ConceptsSection concepts={concepts} onAnswer={home.answerConcept} onUnderstood={conceptUnderstood} onTapWord={home.tapConceptWord} />

          {pending.length === 0 && (
            <section aria-label="Practice" className="flex flex-col gap-4">
              <h2 className={SECTION_TITLE}>Practice</h2>
              <PracticeModesGrid modes={PRACTICE_MODES} wordCount={wordCount} suggested={suggested} onOpen={setOpenMode} />
            </section>
          )}
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
