"use client"

import type { Box, DiagramLayout } from "./diagram-layout"
import styles from "./diagram.module.css"
import { TappableText } from "./tappable-text"

type Props = {
  layout: DiagramLayout
  current: number
  saved: ReadonlySet<string>
  onTap: (word: string, keyPhrase: string) => void
}

const KIND_STYLE: Record<Box["kind"], string> = {
  input: "rounded-[14px] bg-[#3F6E4B] text-[#F9F4F2]",
  process: "rounded-full bg-[#B4441C] text-[#F9F4F2]",
  output: "rounded-[14px] bg-[#2D2C2B] text-[#F9F4F2]",
  place: "rounded-[14px] bg-[#4A2F7A] text-[#F9F4F2]",
}

const pct = (value: number, total: number) => `${(value / total) * 100}%`

function stateOf(step: number, current: number) {
  if (step === current) return "current"
  return step < current ? "done" : "later"
}

/** The concept as a process map: everything visible but faded, explained steps solid, the current one lit. */
export function ConceptDiagram({ layout, current, saved, onTap }: Props) {
  const { boxes, edges, width, height } = layout
  return (
    <figure
      aria-label="Diagram of the idea, step by step"
      className="relative w-full overflow-hidden rounded-[20px] bg-[#EFEAE6]"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {boxes.filter((b) => b.zone).map((zone) => (
        <div
          key={zone.id}
          className={`absolute rounded-[28px] border-2 border-[#6B4FA0]/50 bg-[#6B4FA0]/15 transition-opacity duration-500 ${stateOf(zone.step, current) === "later" ? "opacity-30" : ""}`}
          style={{ left: pct(zone.x, width), top: pct(zone.y, height), width: pct(zone.w, width), height: pct(zone.h, height) }}
        >
          <span className="absolute top-2 left-3 rounded-full bg-[#4A2F7A] px-3 py-1 text-[13px] font-bold text-[#F9F4F2]">
            <TappableText text={zone.fr} saved={saved} onTap={onTap} />
          </span>
        </div>
      ))}
      <svg viewBox={`0 0 ${width} ${height}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#8C8178" />
          </marker>
          <marker id="head-now" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#0061EF" />
          </marker>
        </defs>
        {edges.map((edge) => {
          const state = stateOf(edge.step, current)
          return (
            <path
              key={`${edge.from}-${edge.to}-${current === edge.step}`}
              d={edge.path}
              fill="none"
              stroke={state === "current" ? "#0061EF" : "#8C8178"}
              strokeWidth={state === "current" ? 4 : 2.5}
              strokeDasharray={state === "later" ? "6 8" : undefined}
              opacity={state === "later" ? 0.3 : 1}
              markerEnd={`url(#${state === "current" ? "head-now" : "head"})`}
              className={state === "current" ? styles.drawing : undefined}
            />
          )
        })}
      </svg>
      {edges.filter((e) => e.label).map((edge) => (
        <span
          key={`label-${edge.from}-${edge.to}`}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F9F4F2] px-2 text-[12px] font-semibold text-[#2D2C2B] transition-opacity ${stateOf(edge.step, current) === "later" ? "opacity-30" : ""}`}
          style={{ left: pct(edge.labelX, width), top: pct(edge.labelY, height) }}
        >
          <TappableText text={edge.label!} saved={saved} onTap={onTap} />
        </span>
      ))}
      {boxes.filter((b) => !b.zone).map((box) => {
        const state = stateOf(box.step, current)
        return (
          <div
            key={`${box.id}-${state}`}
            className={`absolute flex items-center justify-center px-3 text-center text-[14px] leading-tight font-bold shadow-[0_2px_0_rgb(0_0_0/0.15)] transition-opacity duration-500 md:text-[16px] ${KIND_STYLE[box.kind]} ${state === "later" ? "opacity-25" : ""} ${state === "current" ? `${styles.current} ring-4 ring-[#FFCE00]` : ""}`}
            style={{ left: pct(box.x, width), top: pct(box.y, height), width: pct(box.w, width), height: pct(box.h, height) }}
          >
            <TappableText text={box.fr} saved={saved} onTap={onTap} />
          </div>
        )
      })}
    </figure>
  )
}
