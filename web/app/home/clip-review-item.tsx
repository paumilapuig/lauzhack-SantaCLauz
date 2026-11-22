"use client"

import { Check, Undo2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { HomeClip } from "@/lib/student-contract"
import { ClipCard } from "./clip-card"
import { ActionButton } from "./exercises/controls"

type Props = {
  clip: HomeClip
  index: number
  marks: Record<string, string>
  onToggle: (word: string) => void
  onDone: (clipId: string) => Promise<void>
  onDiscard: (clipId: string) => Promise<void>
}

const plural = (n: number) => `${n} word${n === 1 ? "" : "s"}`

/** A clip to review, with its two ways out: Done (keep the words) or Discard (pressed by mistake). */
export function ClipReviewItem({ clip, index, marks, onToggle, onDone, onDiscard }: Props) {
  const [busy, setBusy] = useState<"done" | "discard" | null>(null)
  const marked = Object.keys(marks).length

  async function close(action: "done" | "discard") {
    setBusy(action)
    try {
      if (action === "done") {
        await onDone(clip.id)
        toast.success(marked > 0 ? `${plural(marked)} ready to practise` : "Clip reviewed")
      } else {
        await onDiscard(clip.id)
        toast.success("Clip removed")
      }
    } catch {
      toast.error("Could not save. Try again.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ "--i": index } as React.CSSProperties} className="flex animate-rise flex-col gap-3">
      <ClipCard
        clip={clip}
        index={index}
        saved={new Set(Object.keys(marks))}
        translate={(word) => marks[word.toLowerCase()] ?? ""}
        onToggle={onToggle}
      />
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p aria-live="polite" className="mr-auto text-[14px] font-medium text-label-secondary tabular-nums">
          {marked > 0 ? `${plural(marked)} marked` : "Tap the words you didn't understand"}
        </p>
        <ActionButton
          tone="soft"
          onClick={() => close("discard")}
          disabled={busy !== null}
          title="Pressed the button by mistake? Remove this clip."
          className="h-12 px-5 text-[15px]"
        >
          <Undo2 className="size-4" aria-hidden />
          Discard
        </ActionButton>
        <ActionButton onClick={() => close("done")} disabled={busy !== null} className="h-12 px-6 text-[15px]">
          <Check className="size-4" aria-hidden strokeWidth={3} />
          {busy === "done" ? "Saving…" : "Done"}
        </ActionButton>
      </div>
    </div>
  )
}
