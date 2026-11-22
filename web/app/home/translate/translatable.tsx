"use client"

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react"
import { translateFrToEs } from "./browser-translator"
import { isInteractive, overlaps, selectedRange, tagPosition, wordRangeAt } from "./ranges"

const HIGHLIGHT = "loopd-translate" // styled with ::highlight(loopd-translate) in globals.css

type Item = { id: number; range: Range; text: string; translation: string | null | undefined; at: { top: number; left: number } | null }

type Props = {
  children: ReactNode
  /** a translation Loop'd already knows (the lesson glossary); else the browser translates */
  known?: (text: string) => string | null
}

type HighlightRegistry = { set(name: string, value: unknown): void; delete(name: string): void }
const highlights = () => (globalThis.CSS as { highlights?: HighlightRegistry } | undefined)?.highlights
const HighlightCtor = () => (globalThis as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight

/**
 * Any French text inside can be translated: click a word, or select a sentence.
 * The text gets the yellow mark of a hard word and its Spanish appears under it; click the Spanish to hide it.
 * Nothing in the page is rewritten: the mark is a CSS highlight over a Range.
 */
export function Translatable({ children, known }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)
  const selecting = useRef(false)
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const registry = highlights()
    const Ctor = HighlightCtor()
    if (!registry || !Ctor) return
    registry.set(HIGHLIGHT, new Ctor(...items.map((item) => item.range)))
    return () => registry.delete(HIGHLIGHT)
  }, [items])

  useEffect(() => {
    const container = box.current
    if (!container) return
    // a step changed or the page resized: drop marks whose text is gone, move the others
    const refresh = () =>
      setItems((current) => {
        const kept = current.filter((item) => item.range.startContainer.isConnected && item.range.toString().trim() === item.text)
        return kept.map((item) => ({ ...item, at: tagPosition(item.range, container) }))
      })
    const ownUi = (node: Node) => (node instanceof Element ? node : node.parentElement)?.closest("[data-translate-ui]")
    const observer = new MutationObserver((records) => {
      if (!records.every((record) => ownUi(record.target))) refresh()
    })
    observer.observe(container, { childList: true, subtree: true, characterData: true })
    globalThis.addEventListener("resize", refresh)
    return () => {
      observer.disconnect()
      globalThis.removeEventListener("resize", refresh)
    }
  }, [])

  function add(range: Range) {
    const container = box.current
    const text = range.toString().trim()
    if (!container || !text) return
    const id = nextId.current++
    const at = tagPosition(range, container)
    setItems((current) => [...current.filter((item) => !overlaps(item.range, range)), { id, range, text, translation: undefined, at }])
    const fromGlossary = known?.(text.toLocaleLowerCase("fr")) ?? null
    const translation = fromGlossary ? Promise.resolve(fromGlossary) : translateFrToEs(text)
    translation.then((es) => setItems((current) => current.map((item) => (item.id === id ? { ...item, translation: es } : item))))
  }

  function onPointerUp() {
    const container = box.current
    const range = container && selectedRange(container)
    if (!range) return
    selecting.current = true
    add(range)
    // clear the browser selection after this click is handled, so the yellow mark shows
    setTimeout(() => {
      globalThis.getSelection?.()?.removeAllRanges()
      selecting.current = false
    })
  }

  function onClick(event: MouseEvent) {
    if (selecting.current || event.defaultPrevented || isInteractive(event.target)) return
    const range = wordRangeAt(event.clientX, event.clientY)
    if (!range) return
    const same = items.find((item) => overlaps(item.range, range) && item.text === range.toString())
    if (same) return setItems((current) => current.filter((item) => item.id !== same.id))
    add(range)
  }

  const hide = (id: number) => setItems((current) => current.filter((item) => item.id !== id))

  return (
    <div ref={box} className="relative" onPointerUp={onPointerUp} onKeyUp={onPointerUp} onClick={onClick}>
      {children}
      {items.map((item) =>
        item.at ? (
          <button
            key={item.id}
            type="button"
            data-translate-ui
            onClick={() => hide(item.id)}
            aria-label={`${item.text}: ${item.translation ?? "translating"}. Hide`}
            style={{ top: item.at.top, left: item.at.left }}
            className="absolute z-20 max-w-[min(420px,100%)] animate-pop rounded-[10px] border border-word-yellow/25 bg-word-yellow-bg px-2.5 py-1 text-left text-[14px] leading-snug font-bold text-word-yellow"
          >
            <span lang="es">{item.translation === undefined ? "…" : (item.translation ?? "No translation yet. Tap again in a moment")}</span>
          </button>
        ) : null,
      )}
      <p role="status" data-translate-ui className="sr-only">
        {items.at(-1)?.translation ? `${items.at(-1)!.text}: ${items.at(-1)!.translation}` : ""}
      </p>
    </div>
  )
}
