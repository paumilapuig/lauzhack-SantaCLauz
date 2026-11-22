"use client"

import { useEffect, useState } from "react"
import { ProgressHero } from "@/components/progress-hero"
import { ProgressMessage } from "@/components/progress-message"
import { StudentPage } from "@/components/student-page"
import type { ProgressMessage as Message } from "@/lib/student-contract"
import { getHomeApi } from "@/app/home/getHomeApi"

/** Loaded in the browser: the API needs the student's login token. */
export function ProgressView() {
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    getHomeApi()
      .progress()
      .then(({ messages }) => setMessages(messages))
      .catch(() => setFailed(true))
  }, [])

  const hero = messages?.find((m) => m.kind === "learned_this_week")
  const rest = messages?.filter((m) => m !== hero) ?? []

  return (
    <StudentPage title="Progress" context="this week" lead="What you no longer need help with. Never a percentage.">
      {failed ? (
        <p className="text-[19px] text-label-secondary">No progress yet. Review a class to get started.</p>
      ) : !messages ? (
        <p className="text-[19px] text-label-secondary">Loading…</p>
      ) : (
        <div className="flex flex-col gap-10">
          {hero && <ProgressHero message={hero} />}
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
