"use client"

import { useState } from "react"
import { stepKey, type PlanStep } from "./study-plan"

const storageKey = () => `loopd-plan-done-${new Date().toDateString()}`

function load(): PlanStep[] {
  try {
    const saved = globalThis.localStorage?.getItem(storageKey())
    return saved ? (JSON.parse(saved) as PlanStep[]) : []
  } catch {
    return []
  }
}

function save(steps: PlanStep[]) {
  try {
    globalThis.localStorage?.setItem(storageKey(), JSON.stringify(steps))
  } catch {
    // private mode or blocked storage: the plan still works for this visit
  }
}

/** Steps of today's plan the student already finished (kept in this browser for the day). */
export function useCompletedSteps() {
  const [completed, setCompleted] = useState<PlanStep[]>(load)

  function markDone(step: PlanStep) {
    setCompleted((current) => {
      const next = [...current.filter((s) => stepKey(s) !== stepKey(step)), step]
      save(next)
      return next
    })
  }

  return { completed, markDone }
}
