"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import type { HomeReview as HomeReviewData } from "@/lib/student-contract"
import { useTodayLabel } from "@/components/page-title"
import { StudentPage } from "@/components/student-page"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ClipCard } from "./clip-card"
import { getHomeReview, getMyWords, removeMark, saveMark, savePractice, translate } from "./data"
import type { ExerciseResult } from "./exercises/types"
import { MyWordsList } from "./my-words-list"
import { PRACTICE_MODES } from "./practice-modes"
import { PracticeModesList } from "./practice-modes-list"
import type { MyWord } from "./types"
import { usableWords } from "./usable-words"

function Section({ title, count, className = "", children }: { title: string; count?: number; className?: string; children: ReactNode }) {
  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      <h2 className="text-[15px] leading-5 font-medium text-label-secondary">
        {title}
        {count !== undefined && <span className="font-mono tabular-nums"> {count}</span>}
      </h2>
      {children}
    </section>
  )
}

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
  const remove = (lemma: string) => removeMark(lemma).then(refreshWords)

  return (
    <StudentPage
      title="Repasar"
      context={today}
      sidebar={
        <section className="mt-6 flex flex-col gap-2">
          <h2 className="px-3 text-[13px] leading-4 text-label-secondary">Tus palabras</h2>
          <MyWordsList variant="compact" words={words} onRemove={remove} />
        </section>
      }
    >
      {failed ? (
        <p role="alert" className="text-[19px]">No se han podido cargar tus clips.</p>
      ) : !review ? (
        <p className="text-[19px] text-label-secondary">Cargando…</p>
      ) : (
        <>
          <Section title="Clips" count={review.clips.length}>
            <div className="flex flex-col gap-12">
              {review.clips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} saved={saved} translate={translate} onToggle={(word) => toggle(word, clip.id)} />
              ))}
            </div>
          </Section>
          <Section title="Tus palabras" count={words.length} className="lg:hidden">
            <MyWordsList words={words} onRemove={remove} />
          </Section>
          <Section title="Practicar">
            <PracticeModesList modes={PRACTICE_MODES} wordCount={(m) => usableWords(words, m.needs).length} onOpen={setOpenMode} />
          </Section>
        </>
      )}
      <Dialog open={!!mode} onOpenChange={(open) => !open && closeMode()}>
        {mode && (
          <DialogContent
            showCloseButton={false}
            className="student bg-background text-label [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text',system-ui,sans-serif] inset-0 top-0 left-0 h-dvh max-w-none translate-x-0 translate-y-0 content-start overflow-y-auto rounded-none p-6 md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[90dvh] md:max-w-[720px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl sm:max-w-none"
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
