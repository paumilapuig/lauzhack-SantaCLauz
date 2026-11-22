"use client"

import type { Box, DiagramLayout } from "./diagram-layout"
import styles from "./diagram.module.css"
import { TappableText } from "./tappable-text"

type Props = {
  layout: DiagramLayout
  current: number
  saved: ReadonlySet<string>
  onTap: (word: string, keyPhrase: string) => void
  onSelectStep: (step: number) => void
}

const ORANGE = "#F47D31"
const MUTED = "#545454"
const LINE = "#D9D9D9"

const KIND_STYLE: Record<Box["kind"], string> = {
  input: "rounded-[16px] border-2 border-[#D9D9D9] bg-white text-[#1F243C]",
  process: "rounded-full bg-[#F47D31] text-white",
  output: "rounded-[16px] bg-[#0E101A] text-white",
  place: "rounded-[16px] bg-[#0E101A] text-white",
}

const pct = (value: number, total: number) => `${(value / total) * 100}%`

/** Words become tappable once their step has been explained; before that, a click opens the step. */
function Label({ text, later, saved, onTap }: { text: string; later: boolean; saved: ReadonlySet<string>; onTap: Props["onTap"] }) {
  return later ? <span lang="fr">{text}</span> : <TappableText text={text} saved={saved} onTap={onTap} />
}

function stateOf(step: number, current: number) {
  if (step === current) return "current"
  return step < current ? "done" : "later"
}

/** The concept as a process map: everything visible but faded, explained steps solid, the current one lit. */
export function ConceptDiagram({ layout, current, saved, onTap, onSelectStep }: Props) {
  const { boxes, edges, width, height } = layout
  return (
    <figure
      aria-label="Diagram of the idea, step by step"
      className="relative w-full overflow-hidden rounded-[16px] border border-[#EBEBEB] bg-[#F5F5F5]"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {boxes.filter((b) => b.zone).map((zone) => (
        <div
          key={zone.id}
          onClick={() => onSelectStep(zone.step)}
          className={`${styles.box} absolute rounded-[24px] border-2 border-dashed border-[#D9D9D9] bg-white ${stateOf(zone.step, current) === "later" ? "opacity-40" : ""}`}
          style={{ left: pct(zone.x, width), top: pct(zone.y, height), width: pct(zone.w, width), height: pct(zone.h, height) }}
        >
          <span className={`${styles.onDark} absolute top-2 left-3 rounded-full bg-[#0E101A] px-3 py-1 text-[13px] font-bold text-white`}>
            <Label text={zone.fr} later={stateOf(zone.step, current) === "later"} saved={saved} onTap={onTap} />
          </span>
        </div>
      ))}
      <svg viewBox={`0 0 ${width} ${height}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={MUTED} />
          </marker>
          <marker id="head-now" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={ORANGE} />
          </marker>
          <marker id="head-later" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={LINE} />
          </marker>
        </defs>
        {edges.map((edge) => {
          const state = stateOf(edge.step, current)
          const color = state === "current" ? ORANGE : state === "done" ? MUTED : LINE
          return (
            <path
              key={`${edge.from}-${edge.to}-${current === edge.step}`}
              d={edge.path}
              fill="none"
              stroke={color}
              strokeWidth={state === "current" ? 5 : 3}
              strokeLinecap="round"
              strokeDasharray={state === "later" ? "6 8" : undefined}
              markerEnd={`url(#${state === "current" ? "head-now" : state === "done" ? "head" : "head-later"})`}
              className={state === "current" ? styles.drawing : undefined}
            />
          )
        })}
      </svg>
      {edges.filter((e) => e.label).map((edge) => {
        const state = stateOf(edge.step, current)
        return (
          <span
            key={`label-${edge.from}-${edge.to}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 text-[12px] font-bold transition-opacity ${
              state === "current" ? "border-[#F47D31] bg-[#FEF2EA] text-[#B4561A]" : "border-[#EBEBEB] bg-white text-[#1F243C]"
            } ${state === "later" ? "opacity-40" : ""}`}
            style={{ left: pct(edge.labelX, width), top: pct(edge.labelY, height) }}
          >
            <Label text={edge.label!} later={state === "later"} saved={saved} onTap={onTap} />
          </span>
        )
      })}
      {boxes.filter((b) => !b.zone).map((box) => {
        const state = stateOf(box.step, current)
        return (
          <div
            key={`${box.id}-${state}`}
            onClick={() => onSelectStep(box.step)}
            title={`Step ${box.step + 1}`}
            className={`${styles.box} ${box.kind === "input" ? "" : styles.onDark} absolute flex items-center justify-center gap-2 px-3 text-center text-[14px] leading-tight font-bold tracking-[-0.01em] md:text-[16px] ${KIND_STYLE[box.kind]} ${
              state === "later" ? "opacity-25" : ""
            } ${state === "current" ? `${styles.current} ring-4 ring-[#F47D31]/40 ring-offset-2 ring-offset-[#F5F5F5]` : ""}`}
            style={{ left: pct(box.x, width), top: pct(box.y, height), width: pct(box.w, width), height: pct(box.h, height) }}
          >
            {box.kind === "process" && (
              <span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-[#F47D31] tabular-nums">
                {box.step + 1}
              </span>
            )}
            <Label text={box.fr} later={state === "later"} saved={saved} onTap={onTap} />
          </div>
        )
      })}
    </figure>
  )
}
