"use client"

import { useEffect, useRef, useState } from "react"
import { Check, CircleHelp, Rewind } from "lucide-react"
import { Button } from "./button"

const SAVED_MS = 2000

const VARIANTS = {
  unclear: {
    label: "No he entendido",
    Icon: Rewind,
    className: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  lost: {
    label: "Me he perdido",
    Icon: CircleHelp,
    className: "bg-lost text-white hover:bg-lost/90 shadow-[var(--shadow-subtle)]",
  },
}

export function BigButton({
  variant,
  onPress,
}: {
  variant: "unclear" | "lost"
  onPress: () => void
}) {
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const { label, Icon, className } = VARIANTS[variant]
  const ShownIcon = saved ? Check : Icon

  function handleClick() {
    if (saved) return
    onPress()
    setSaved(true)
    timer.current = setTimeout(() => setSaved(false), SAVED_MS)
  }

  return (
    <>
      <Button
        onClick={handleClick}
        aria-disabled={saved}
        size="xl"
        className={`h-20 min-h-[80px] w-full min-w-0 flex-1 shrink text-[22px] md:h-[88px] md:text-[24px] aria-disabled:cursor-not-allowed ${className}`}
      >
        <ShownIcon className="size-7" aria-hidden />
        {saved ? "Guardado" : label}
      </Button>
      <span role="status" className="sr-only">
        {saved ? "Guardado" : ""}
      </span>
    </>
  )
}
