"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import type { HomeReview as HomeReviewData } from "@/lib/student-contract"
import { StudentPage } from "@/components/student-page"
import { ClipCard } from "./clip-card"
import { getHomeReview, getMyWords, removeMark, saveMark, savePractice, translate } from "./data"
import type { ExerciseResult } from "./exercises/types"
import { MyWordsList } from "./my-words-list"
import { PRACTICE_MODES } from "./practice-modes"
import { PracticeModesList } from "./practice-modes-list"
import type { MyWord } from "./types"
import { usableWords } from "./usable-words"

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="flex flex-col">
      <h2 className="flex items-baseline gap-2 border-b border-separator pb-3 text-[22px] font-semibold tracking-[-0.02em]">
        {title}
        {count !== undefined && <span className="text-[17px] font-normal text-label-secondary tabular-nums">{count}</span>}
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

  const mode = PRACTICE_MODES.find((m) => m.id === openMode)
  if (mode) {
    const finish = (results: ExerciseResult[]) =>
      results.forEach(({ lemma, passed }) =>
        savePractice({ lemma, clip_id: words.find((w) => w.lemma === lemma)?.clip_id ?? null, passed }),
      )
    return (
      <StudentPage>
        <mode.Component words={usableWords(words, mode.needs)} onFinish={finish} onExit={() => setOpenMode(null)} />
      </StudentPage>
    )
  }

  const saved = new Set(words.map((w) => w.lemma))
  const toggle = async (word: string, clipId: string) => {
    const lemma = word.toLowerCase()
    await (saved.has(lemma) ? removeMark(lemma) : saveMark(word, clipId))
    await refreshWords()
  }
  const remove = (lemma: string) => removeMark(lemma).then(refreshWords)

  return (
    <StudentPage title="Para repasar" lead="Lo que se te escapó hoy en clase, con la voz de tu profe">
      {failed ? (
        <p role="alert" className="text-[19px]">No se han podido cargar tus clips.</p>
      ) : !review ? (
        <p className="text-[19px] text-label-secondary">Cargando…</p>
      ) : (
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Section title="Tus clips" count={review.clips.length}>
            <div className="flex flex-col divide-y divide-separator">
              {review.clips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} saved={saved} translate={translate} onToggle={(word) => toggle(word, clip.id)} />
              ))}
            </div>
          </Section>
          <div className="flex flex-col gap-10 lg:sticky lg:top-6">
            <Section title="Tus palabras" count={words.length}>
              <MyWordsList words={words} onRemove={remove} />
            </Section>
            <Section title="Practicar">
              <PracticeModesList modes={PRACTICE_MODES} wordCount={(m) => usableWords(words, m.needs).length} onOpen={setOpenMode} />
            </Section>
          </div>
        </div>
      )}
    </StudentPage>
  )
}
