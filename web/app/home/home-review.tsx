"use client"

import { Check } from "lucide-react"
import { useState } from "react"
import { useTodayLabel } from "@/components/page-title"
import { StudentPage } from "@/components/student-page"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ClipCard } from "./clip-card"
import { ConceptsSection } from "./concepts-section"
import { PRACTICE_MODES } from "./practice-modes"
import { PracticeModesGrid } from "./practice-modes-grid"
import { PracticeModesList, type PracticeModeItem } from "./practice-modes-list"
import { usableWords } from "./usable-words"
import { useHomeReview } from "./use-home-review"

const DONE_BUTTON =
  "inline-flex h-11 items-center gap-2 self-end rounded-full bg-charcoal px-5 text-[15px] font-bold text-primary-foreground shadow-[var(--shadow-subtle)] transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"

export function HomeReview() {
  const { review, marks, words, concepts, failed, toggle, finishClip, savePractice, answerConcept, conceptUnderstood } =
    useHomeReview()
  const [openMode, setOpenMode] = useState<string | null>(null)
  const [finishing, setFinishing] = useState<string | null>(null)
  const today = useTodayLabel()

  const mode = PRACTICE_MODES.find((m) => m.id === openMode)
  const closeMode = () => setOpenMode(null)
  const wordCount = (m: PracticeModeItem) => usableWords(words, m.needs).length

  async function done(clipId: string) {
    setFinishing(clipId)
    try {
      await finishClip(clipId)
    } finally {
      setFinishing(null)
    }
  }

  const pending = review?.clips ?? []

  return (
    <StudentPage
      title="Review"
      context={today}
      lead={
        pending.length > 0
          ? "Listen to the class again. Tap every word you didn't understand, then press Done."
          : "No clips left to review. Practise the words you picked."
      }
      wide
    >
      {failed ? (
        <p role="alert" className="text-[19px]">Your clips could not be loaded. Is the server running?</p>
      ) : !review ? (
        <p className="text-[19px] text-label-secondary">Loading…</p>
      ) : null}

      {review && <ConceptsSection concepts={concepts} onAnswer={answerConcept} onUnderstood={conceptUnderstood} />}

      {failed || !review ? null : pending.length === 0 ? (
        <section aria-label="Practice">
          <PracticeModesGrid modes={PRACTICE_MODES} wordCount={wordCount} onOpen={setOpenMode} />
        </section>
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
          <section aria-label="Clips to review" className="flex min-w-0 flex-col gap-10">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[15px] font-bold tracking-[-0.02em] text-foreground">From class</h2>
              <p className="text-[14px] tabular-nums text-label-secondary">
                {pending.length} to review
              </p>
            </div>
            {pending.map((clip, index) => {
              const clipMarks = marks[clip.id] ?? {}
              return (
                <div key={clip.id} className="flex flex-col gap-3">
                  <ClipCard
                    clip={clip}
                    index={index}
                    saved={new Set(Object.keys(clipMarks))}
                    translate={(word) => clipMarks[word.toLowerCase()] ?? ""}
                    onToggle={(word) => toggle(clip.id, word)}
                  />
                  <button type="button" onClick={() => done(clip.id)} disabled={finishing === clip.id} className={DONE_BUTTON}>
                    <Check className="size-4" aria-hidden />
                    {finishing === clip.id ? "Saving…" : "Done"}
                  </button>
                </div>
              )
            })}
          </section>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-[24px] border border-border bg-card p-5">
              <h2 className="mb-3 px-1 text-[15px] font-bold tracking-[-0.02em] text-foreground">Practice</h2>
              <PracticeModesList modes={PRACTICE_MODES} wordCount={wordCount} onOpen={setOpenMode} />
            </div>
          </aside>
        </div>
      )}

      <Dialog open={!!mode} onOpenChange={(open) => !open && closeMode()}>
        {mode && (
          <DialogContent
            showCloseButton={false}
            className="student inset-0 top-0 left-0 h-dvh max-w-none translate-x-0 translate-y-0 content-start overflow-y-auto rounded-none border-0 bg-background p-6 text-label ring-0 md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[90dvh] md:max-w-[720px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[32px] md:border md:border-border sm:max-w-none"
          >
            <div className="flex items-center justify-between">
              <DialogTitle className="text-[20px] leading-tight font-semibold">{mode.name}</DialogTitle>
              <button
                type="button"
                onClick={closeMode}
                className="min-h-11 px-2 text-[17px] font-medium text-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                Close
              </button>
            </div>
            <mode.Component words={usableWords(words, mode.needs)} onFinish={savePractice} onExit={closeMode} />
          </DialogContent>
        )}
      </Dialog>
    </StudentPage>
  )
}
