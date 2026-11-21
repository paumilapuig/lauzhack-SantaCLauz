"use client"

import { useEffect, useRef, useState } from "react"
import { Check, CircleHelp, Rewind } from "lucide-react"
import { Button } from "./button"

const SAVED_MS = 2000

const VARIANTS = {
  unclear: { label: "No he entendido", Icon: Rewind, className: "bg-primary" },
  lost: { label: "Me he perdido", Icon: CircleHelp, className: "bg-lost text-white" },
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
    onPress()
    setSaved(true)
    timer.current = setTimeout(() => setSaved(false), SAVED_MS)
  }

  return (
    <Button
      onClick={handleClick}
      disabled={saved}
      className={`h-[72px] w-full gap-3 text-xl font-bold md:text-[22px] ${className}`}
    >
      <ShownIcon className="size-6" aria-hidden />
      {saved ? "Guardado" : label}
    </Button>
  )
}
