"use client"

import { useEffect, useState } from "react"
import type { HomeReview as HomeReviewData } from "@/lib/student-contract"
import { ClipCard } from "./clip-card"
import { getHomeReview } from "./data"
import { PracticeFlow } from "./practice-flow"
import { WordCard } from "./word-card"

export function HomeReview() {
  const [review, setReview] = useState<HomeReviewData | null>(null)
  const [practicing, setPracticing] = useState<string | null>(null)

  useEffect(() => {
    getHomeReview().then(setReview)
  }, [])

  if (!review) return <p className="text-muted-foreground">Cargando…</p>

  const { clips, words_to_practice: words } = review
  const active = words.find((w) => w.lemma === practicing)

  const finish = (lemma: string) => {
    setReview({ ...review, words_to_practice: words.filter((w) => w.lemma !== lemma) })
    setPracticing(null)
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Tus clips</h2>
        {clips.map((clip) => (
          <ClipCard key={clip.id} clip={clip} words={words} />
        ))}
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Palabras para practicar</h2>
        {active ? (
          <PracticeFlow key={active.lemma} word={active} onDone={finish} onExit={() => setPracticing(null)} />
        ) : (
          words.map((word) => (
            <WordCard key={word.lemma} word={word} onPractice={() => setPracticing(word.lemma)} />
          ))
        )}
      </section>
    </>
  )
}
