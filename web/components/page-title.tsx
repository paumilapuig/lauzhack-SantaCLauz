"use client"

import { useSyncExternalStore } from "react"

const noop = () => () => {}
const todayLabel = () => new Date().toLocaleDateString("es", { weekday: "long", day: "numeric" })

// Empty on the server so the date never mismatches hydration
export function useTodayLabel() {
  return useSyncExternalStore(noop, todayLabel, () => "")
}

export function PageTitle({ title, context }: { title: string; context?: string }) {
  return (
    <h1 className="text-balance text-[32px] leading-10 font-medium tracking-[-0.02em] lg:text-[40px] lg:leading-12">
      {title}
      {context && <span className="text-label-secondary"> · {context}</span>}
    </h1>
  )
}
