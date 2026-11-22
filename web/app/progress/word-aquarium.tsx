"use client"

import { useState } from "react"
import type { ProgressWord } from "@/lib/student-contract"
import { arrangeTank, stageOf, type Creature } from "./aquarium-layout"
import { AQUARIUM_CSS } from "./aquarium-styles"
import { SeaCreature } from "./sea-creature"

const NO_HELP_LEVEL = 2

/** Joins class names as they are (CSS-module names included; `cn` from "cn" drops them). */
const joinClasses = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ")

const label = (w: ProgressWord) => `${w.lemma}${w.translation_es ? `, ${w.translation_es}` : ""}: ${stageOf(w.level)}`

function Seaweed({ left, height, color }: { left: string; height: number; color: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 100" className="absolute bottom-[14%]" style={{ left, height, width: height / 5 }} preserveAspectRatio="none">
      <path d="M10 100 C2 80 18 65 10 48 C3 33 17 18 10 0" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function Animal({ creature, index }: { creature: Creature; index: number }) {
  const { word, species, x, y } = creature
  const grown = word.level >= NO_HELP_LEVEL
  const onSand = word.level <= 0 || species === "starfish"
  return (
    <li
      aria-label={label(word)}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className={joinClasses("aq-creature", onSand ? "aq-rest" : "aq-swim", "block")}
        style={{ animationDelay: `${index * 110}ms` }}
        title={word.translation_es ?? undefined}
      >
        <SeaCreature species={species} level={word.level} />
      </span>
      <span
        lang="fr"
        className={joinClasses(
          "rounded-full px-2 py-0.5 text-[13px] leading-tight font-bold whitespace-nowrap",
          grown ? "bg-white/90 text-primary" : "bg-white/90 text-heading",
        )}
      >
        {word.lemma}
      </span>
    </li>
  )
}

function Legend() {
  const items: [number, string][] = [[0, "Egg"], [1, "Baby"], [2, "No help needed"], [3, "Fully grown"]]
  return (
    <ul aria-label="How animals grow" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-label-secondary">
      {items.map(([level, text]) => (
        <li key={level} className="flex items-center gap-2">
          <span className="flex h-8 w-10 items-center justify-center [&>svg]:h-7 [&>svg]:w-auto">
            <SeaCreature species="fish" level={level} />
          </span>
          {text}
        </li>
      ))}
    </ul>
  )
}

function OtherWords({ words }: { words: ProgressWord[] }) {
  const [open, setOpen] = useState(false)
  if (words.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-fit text-[14px] font-semibold text-label-secondary underline underline-offset-4"
      >
        {open ? "Hide the other words" : "Show all your words"}
      </button>
      {open && (
        <ul aria-label="Other words" className="flex flex-wrap gap-2">
          {words.map((w) => (
            <li
              key={w.lemma}
              aria-label={label(w)}
              className={joinClasses(
                "rounded-full px-3 py-1 text-[14px] font-bold",
                w.level >= NO_HELP_LEVEL ? "bg-primary-soft text-primary" : "bg-word-yellow-bg text-word-yellow",
              )}
            >
              <span lang="fr">{w.lemma}</span>
              {w.translation_es && <span lang="es" className="font-normal"> · {w.translation_es}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Every word she met is a sea animal that grows with her level (egg → baby → grown → fully grown): no number,
 * no total. The tank holds a limited number so it never gets cluttered; the rest are one tap away.
 */
export function WordAquarium({ words }: { words: ProgressWord[] }) {
  const tank = arrangeTank(words)
  return (
    <section aria-labelledby="aquarium-title" className="flex flex-col gap-5 rounded-[24px] border border-border bg-card p-5 md:p-7">
      <style>{AQUARIUM_CSS}</style>
      <header className="flex flex-col gap-1">
        <p className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">Your word aquarium</p>
        <h2 id="aquarium-title" className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-heading">
          Every word you met grows a little each time you practise
        </h2>
      </header>
      {words.length === 0 ? (
        <p className="text-[16px] text-label-secondary">Mark a word you don&apos;t understand in a clip: it becomes your first egg.</p>
      ) : (
        <>
          <div className={joinClasses("aq-tank", "relative h-[320px] overflow-hidden rounded-[20px] md:h-[380px]")}>
            <div className={joinClasses("aq-sand", "absolute inset-x-0 bottom-0 h-[16%]")} aria-hidden />
            <Seaweed left="4%" height={120} color="#3F8F7F" />
            <Seaweed left="7%" height={80} color="#58A595" />
            <Seaweed left="93%" height={110} color="#3F8F7F" />
            {[18, 52, 81].map((left, i) => (
              <span
                key={left}
                aria-hidden
                className={joinClasses("aq-bubble", "absolute bottom-[16%] size-2.5 rounded-full border-2 border-white/80")}
                style={{ left: `${left}%`, animationDelay: `${600 + i * 700}ms` }}
              />
            ))}
            <ul aria-label="Your aquarium" className="absolute inset-0">
              {tank.inTank.map((creature, i) => (
                <Animal key={creature.word.lemma} creature={creature} index={i} />
              ))}
            </ul>
          </div>
          <Legend />
          <OtherWords words={tank.outside} />
        </>
      )}
    </section>
  )
}
