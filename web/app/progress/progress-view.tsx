"use client"

import { useEffect, useState } from "react"
import { ProgressHero } from "@/components/progress-hero"
import { ProgressMessage } from "@/components/progress-message"
import { StudentPage } from "@/components/student-page"
import type { Progress } from "@/lib/student-contract"
import { getHomeApi } from "@/app/home/getHomeApi"
import { WeekStrip } from "./week-strip"
import { WordAquarium } from "./word-aquarium"

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

/** Loaded in the browser: the API needs the student's login token. */
export function ProgressView() {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    getHomeApi()
      .progress()
      .then(setProgress)
      .catch(() => setFailed(true))
  }, [])

  const messages = progress?.messages ?? []
  const hero = messages.find((m) => m.kind === "learned_this_week")
  const rest = messages.filter((m) => m !== hero)

  return (
    <StudentPage title="Progress" context="this week" lead="What you no longer need help with. Never a percentage." wide>
      {failed ? (
        <p className="text-[19px] text-label-secondary">No progress yet. Review a class to get started.</p>
      ) : !progress ? (
        <p className="text-[19px] text-label-secondary">Loading…</p>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-10">
            {hero ? <ProgressHero message={hero} /> : <div />}
            <WeekStrip week={progress.week ?? []} today={isoDay(new Date())} />
          </div>
          <WordAquarium words={progress.words ?? []} />
          <ul className="flex flex-col divide-y divide-separator rounded-[24px] border border-border bg-card px-5">
            {rest.map((message) => (
              <li key={message.kind}>
                <ProgressMessage message={message} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </StudentPage>
  )
}
