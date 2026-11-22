"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { ExerciseResult } from "./exercises/types"
import type { PracticeMode } from "./practice-modes"
import { PracticeSummary, type PracticeSummaryData } from "./practice-summary"
import type { MyWord } from "./types"

type Props = {
  mode: PracticeMode | undefined
  words: MyWord[]
  onSave: (results: ExerciseResult[]) => Promise<PracticeSummaryData>
  onClose: (practised: boolean) => void
}

/** A practice game in a sheet; when it ends, the summary of what Loop'd now knows. */
export function PracticeDialog({ mode, words, onSave, onClose }: Props) {
  const [phase, setPhase] = useState<"playing" | "saving" | PracticeSummaryData>("playing")

  function close() {
    const practised = phase !== "playing"
    setPhase("playing")
    onClose(practised)
  }

  async function finish(results: ExerciseResult[]) {
    setPhase("saving")
    setPhase(await onSave(results))
  }

  return (
    <Dialog open={!!mode} onOpenChange={(open) => !open && close()}>
      {mode && (
        <DialogContent
          showCloseButton={false}
          className="student inset-0 top-0 left-0 h-dvh max-w-none translate-x-0 translate-y-0 content-start overflow-y-auto rounded-none border-0 bg-background p-6 text-label ring-0 md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[90dvh] md:max-w-[720px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[32px] md:border md:border-border md:bg-card md:p-8 sm:max-w-none"
        >
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-heading">{mode.name}</DialogTitle>
            <button
              type="button"
              onClick={close}
              className="min-h-11 rounded-full px-3 text-[17px] font-bold text-subtle transition-colors hover:bg-fill hover:text-heading focus-visible:outline-2 focus-visible:outline-primary"
            >
              Close
            </button>
          </div>
          {phase === "playing" ? (
            <mode.Component words={words} onFinish={finish} onExit={close} />
          ) : (
            <PracticeSummary summary={phase === "saving" ? null : phase} onBack={close} />
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}
