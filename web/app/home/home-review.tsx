"use client"

import { useEffect, useState, type ReactNode } from "react"
import type { HomeReview as HomeReviewData, WordToPractice } from "@/lib/student-contract"
import { HAND } from "@/components/notebook"
import { ClipCard } from "./clip-card"
import { getHomeReview } from "./data"
import { PracticeFlow } from "./practice-flow"
import { WordCard } from "./word-card"

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="flex items-baseline gap-3 text-[28px] font-bold">
        {title}
        {count !== undefined && <span className="font-mono text-lg font-normal text-muted-foreground tabular-nums">{count}</span>}
      </h2>
      {children}
    </section>
  )
}

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

  if (failed) return <p role="alert" className="text-lg">No se han podido cargar tus clips.</p>
  if (!review) return <p className="text-lg text-muted-foreground">Cargando…</p>

  const { clips, words_to_practice: words } = review
  const active = words.find((w) => w.lemma === practicing)

  const finish = (lemma: string) => {
    setReview({ ...review, words_to_practice: words.filter((w) => w.lemma !== lemma) })
    setPracticing(null)
  }

  return (
    <>
      <Section title="Tus clips" count={clips.length}>
        <div className="grid gap-6 lg:grid-cols-2">
          {clips.map((clip) => (
            <ClipCard key={clip.id} clip={clip} words={allWords} />
          ))}
        </div>
      </Section>
      <Section title="Palabras para practicar" count={active ? undefined : words.length}>
        {active ? (
          <PracticeFlow key={active.lemma} word={active} onDone={finish} onExit={() => setPracticing(null)} />
        ) : words.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {words.map((word) => (
              <WordCard key={word.lemma} word={word} onPractice={() => setPracticing(word.lemma)} />
            ))}
          </div>
        ) : (
          <p className={`text-3xl text-primary ${HAND}`}>Todo repasado por hoy</p>
        )}
      </Section>
    </>
  )
}
