"use client"

import { useCallback, useEffect, useState } from "react"
import type { HomeReview as HomeReviewData } from "@/lib/student-contract"
import { useTodayLabel } from "@/components/page-title"
import { StudentPage } from "@/components/student-page"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ClipCard } from "./clip-card"
import { getHomeReview, getMyWords, removeMark, saveMark, savePractice, translate } from "./data"
import type { ExerciseResult } from "./exercises/types"
import { PRACTICE_MODES } from "./practice-modes"
import { PracticeModesList } from "./practice-modes-list"
import type { MyWord } from "./types"
import { usableWords } from "./usable-words"

export function HomeReview() {
  const [review, setReview] = useState<HomeReviewData | null>(null)
  const [words, setWords] = useState<MyWord[]>([])
  const [openMode, setOpenMode] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const refreshWords = useCallback(() => getMyWords().then(setWords), [])

  useEffect(() => {
    Promise.all([getHomeReview(), refreshWords()]).then(([data]) => setReview(data)).catch(() => setFailed(true))
  }, [refreshWords])

  const today = useTodayLabel()
  const mode = PRACTICE_MODES.find((m) => m.id === openMode)
  const closeMode = () => setOpenMode(null)
  const finish = (results: ExerciseResult[]) =>
    results.forEach(({ lemma, passed }) =>
      savePractice({ lemma, clip_id: words.find((w) => w.lemma === lemma)?.clip_id ?? null, passed }),
    )

  const saved = new Set(words.map((w) => w.lemma))
  const toggle = async (word: string, clipId: string) => {
    const lemma = word.toLowerCase()
    await (saved.has(lemma) ? removeMark(lemma) : saveMark(word, clipId))
    await refreshWords()
  }

  return (
    <StudentPage
      title="Repasar"
      context={today}
      lead="Escucha otra vez la clase. Toca una palabra cuando no la entiendas."
      wide
    >
      {failed ? (
        <p role="alert" className="text-[19px]">No se han podido cargar tus clips.</p>
      ) : !review ? (
        <p className="text-[19px] text-label-secondary">Cargando…</p>
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
          <section aria-label="Clips" className="flex min-w-0 flex-col gap-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[15px] font-bold tracking-[-0.02em] text-foreground">De la clase</h2>
              <p className="text-[14px] tabular-nums text-label-secondary">{review.clips.length} clips</p>
            </div>
            {review.clips.map((clip, index) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                index={index}
                saved={saved}
                translate={translate}
                onToggle={(word) => toggle(word, clip.id)}
              />
            ))}
          </section>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-[24px] border border-border bg-card p-5">
              <h2 className="mb-3 px-1 text-[15px] font-bold tracking-[-0.02em] text-foreground">Practicar</h2>
              <PracticeModesList
                modes={PRACTICE_MODES}
                wordCount={(m) => usableWords(words, m.needs).length}
                onOpen={setOpenMode}
              />
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
                Cerrar
              </button>
            </div>
            <mode.Component words={usableWords(words, mode.needs)} onFinish={finish} onExit={closeMode} />
          </DialogContent>
        )}
      </Dialog>
    </StudentPage>
  )
}
