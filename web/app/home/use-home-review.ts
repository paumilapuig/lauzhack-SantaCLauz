"use client"

import { useEffect, useMemo, useState } from "react"
import type { HomeReview } from "@/lib/student-contract"
import { marksFrom, withMark, withoutMark, type ClipMarks } from "./clip-marks"
import type { ExerciseResult } from "./exercises/types"
import { getHomeApi } from "./getHomeApi"
import { toMyWord } from "./homeApi"

/** /home state: pending clips, the words marked on them, and the actions that change them. */
export function useHomeReview() {
  const api = useMemo(() => getHomeApi(), [])
  const [review, setReview] = useState<HomeReview | null>(null)
  const [marks, setMarks] = useState<ClipMarks>({})
  const [failed, setFailed] = useState(false)

  function show(data: HomeReview) {
    setReview(data)
    setMarks(marksFrom(data.words_to_practice))
  }

  useEffect(() => {
    let active = true
    api
      .review()
      .then((data) => active && show(data))
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [api])

  async function toggle(clipId: string, word: string) {
    if (marks[clipId]?.[word.toLowerCase()] !== undefined) {
      setMarks((current) => withoutMark(current, clipId, word))
      await api.unmark(clipId, word.toLowerCase())
    } else {
      const result = await api.mark(clipId, word.toLowerCase())
      setMarks((current) => withMark(current, clipId, word, result.translation_es ?? ""))
    }
  }

  async function finishClip(clipId: string) {
    await api.finishClip(clipId)
    show(await api.review())
  }

  const words = (review?.words_to_practice ?? []).map(toMyWord)
  const concepts = review?.concepts_to_learn ?? []

  const answerConcept = (conceptId: string, answers: number[]) => api.answerConcept(conceptId, answers)

  function conceptUnderstood(conceptId: string) {
    setReview((current) =>
      current && { ...current, concepts_to_learn: (current.concepts_to_learn ?? []).filter((c) => c.id !== conceptId) },
    )
  }

  function savePractice(results: ExerciseResult[]) {
    for (const { lemma, passed } of results) {
      const word = words.find((w) => w.lemma === lemma)
      if (!word?.glossary_lemma) continue
      api.practice({ lemma: word.glossary_lemma, clip_id: word.clip_id, passed }).catch((error) => console.error(error))
    }
  }

  return { review, marks, words, concepts, failed, toggle, finishClip, savePractice, answerConcept, conceptUnderstood }
}
