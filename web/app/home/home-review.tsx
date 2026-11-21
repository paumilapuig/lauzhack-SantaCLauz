"use client"

import { useEffect, useState, type ReactNode } from "react"
import type { HomeReview as HomeReviewData, WordToPractice } from "@/lib/student-contract"
import { ClipCard } from "./clip-card"
import { getHomeReview } from "./data"
import { PracticeFlow } from "./practice-flow"
import { WordCard } from "./word-card"

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="flex flex-col">
      <h2 className="flex items-baseline gap-2 border-b border-separator pb-4 text-[28px] font-semibold tracking-[-0.02em]">
        {title}
        {count !== undefined && <span className="text-[19px] font-normal text-label-secondary tabular-nums">{count}</span>}
      </h2>
      {children}
    </section>
  )
}

const LIST = "flex flex-col divide-y divide-separator"

export function HomeReview() {
  const [review, setReview] = useState<HomeReviewData | null>(null)
  const [practicing, setPracticing] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  // ClipCard keeps translating words already practised (level is still < 2)
  const [allWords, setAllWords] = useState<WordToPractice[]>([])

  useEffect(() => {
    getHomeReview()
      .then((data) => {
        setAllWords(data.words_to_practice)
        setReview(data)
      })
      .catch(() => setFailed(true))
  }, [])

  if (failed) return <p role="alert" className="text-[19px]">No se han podido cargar tus clips.</p>
  if (!review) return <p className="text-[19px] text-label-secondary">Cargando…</p>

  const { clips, words_to_practice: words } = review
  const active = words.find((w) => w.lemma === practicing)

  const finish = (lemma: string) => {
    setReview({ ...review, words_to_practice: words.filter((w) => w.lemma !== lemma) })
    setPracticing(null)
  }

  return (
    <>
      <Section title="Tus clips" count={clips.length}>
        <div className={LIST}>
          {clips.map((clip) => (
            <ClipCard key={clip.id} clip={clip} words={allWords} />
          ))}
        </div>
      </Section>
      <Section title="Palabras para practicar" count={active ? undefined : words.length}>
        {active ? (
          <PracticeFlow key={active.lemma} word={active} onDone={finish} onExit={() => setPracticing(null)} />
        ) : words.length > 0 ? (
          <div className={LIST}>
            {words.map((word) => (
              <WordCard key={word.lemma} word={word} onPractice={() => setPracticing(word.lemma)} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-[19px] text-label-secondary">Todo repasado por hoy</p>
        )}
      </Section>
    </>
  )
}
