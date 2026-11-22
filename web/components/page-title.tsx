"use client"

import { useSyncExternalStore } from "react"

const noop = () => () => {}
const todayLabel = () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric" })

export function useTodayLabel() {
  return useSyncExternalStore(noop, todayLabel, () => "")
}

export function PageTitle({ title, context }: { title: string; context?: string }) {
  return (
    <h1 className="text-balance text-[32px] leading-[1.29] font-bold tracking-[-1px] lg:text-[40px]">
      {title}
      {context && <span className="font-medium text-label-secondary"> · {context}</span>}
    </h1>
  )
}
