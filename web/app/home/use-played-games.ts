"use client"

import { useState } from "react"

const storageKey = () => `loopd-played-${new Date().toDateString()}`

function load(): string[] {
  try {
    const saved = globalThis.localStorage?.getItem(storageKey())
    return saved ? (JSON.parse(saved) as string[]) : []
  } catch {
    return []
  }
}

/** Games finished today, kept in this browser for the day (a check on the card, and the next suggestion moves on). */
export function usePlayedGames() {
  const [played, setPlayed] = useState<string[]>(load)

  function markPlayed(modeId: string) {
    setPlayed((current) => {
      const next = current.includes(modeId) ? current : [...current, modeId]
      try {
        globalThis.localStorage?.setItem(storageKey(), JSON.stringify(next))
      } catch {
        // private mode or blocked storage: the check still shows for this visit
      }
      return next
    })
  }

  return { played, markPlayed }
}
