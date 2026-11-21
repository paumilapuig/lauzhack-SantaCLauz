"use client"

import { useSyncExternalStore } from "react"

const FORMAT = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" })
const noSubscription = () => () => {}

// Empty on the server: the date depends on the viewer's clock, not on the prerender
export function TodayLabel() {
  const today = useSyncExternalStore(noSubscription, () => FORMAT.format(new Date()), () => "")
  return <p className="hidden min-h-6 text-muted-foreground first-letter:uppercase sm:block">{today}</p>
}
