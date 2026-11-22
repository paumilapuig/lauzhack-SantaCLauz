import { wordAt } from "./word-at"

const INTERACTIVE = "button, a, input, label, select, textarea, [role='button']"
export const MAX_PHRASE_CHARS = 300

/** Only French text is translated: the closest `lang` around the node must be `fr`. */
export function isFrench(node: Node | null): boolean {
  const element = node instanceof Element ? node : node?.parentElement
  return element?.closest("[lang]")?.getAttribute("lang") === "fr"
}

/** Buttons, links and answers keep their own click. */
export const isInteractive = (target: EventTarget | null) => target instanceof Element && !!target.closest(INTERACTIVE)

type Caret = { node: Node; offset: number }

function caretAt(x: number, y: number): Caret | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
    caretRangeFromPoint?: (x: number, y: number) => Range | null
  }
  const position = doc.caretPositionFromPoint?.(x, y)
  if (position) return { node: position.offsetNode, offset: position.offset }
  const range = doc.caretRangeFromPoint?.(x, y)
  return range ? { node: range.startContainer, offset: range.startOffset } : null
}

/** The French word under a click, as a Range over its letters. */
export function wordRangeAt(x: number, y: number): Range | null {
  const caret = caretAt(x, y)
  if (!caret || caret.node.nodeType !== Node.TEXT_NODE || !isFrench(caret.node)) return null
  const bounds = wordAt(caret.node.textContent ?? "", caret.offset)
  if (!bounds) return null
  const range = document.createRange()
  range.setStart(caret.node, bounds.start)
  range.setEnd(caret.node, bounds.end)
  return range
}

/** A selection that starts or ends inside a word takes the whole word ("po|ur" → "pour"). */
export function snapToWords(range: Range): Range {
  const snapped = range.cloneRange()
  const { startContainer: start, endContainer: end } = snapped
  if (start.nodeType === Node.TEXT_NODE) {
    const word = wordAt(start.textContent ?? "", snapped.startOffset)
    if (word && word.end > snapped.startOffset) snapped.setStart(start, word.start)
  }
  if (end.nodeType === Node.TEXT_NODE) {
    const word = wordAt(end.textContent ?? "", snapped.endOffset)
    if (word && word.start < snapped.endOffset) snapped.setEnd(end, word.end)
  }
  return snapped
}

/** The French text the student selected inside `container`, if any, in whole words. */
export function selectedRange(container: HTMLElement): Range | null {
  const selection = globalThis.getSelection?.()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null
  const range = snapToWords(selection.getRangeAt(0))
  const text = range.toString().trim()
  if (text.length < 2 || text.length > MAX_PHRASE_CHARS) return null
  if (!container.contains(range.commonAncestorContainer) || !isFrench(range.startContainer)) return null
  return range
}

export const overlaps = (a: Range, b: Range) =>
  a.compareBoundaryPoints(Range.START_TO_END, b) > 0 && b.compareBoundaryPoints(Range.START_TO_END, a) > 0

/** Where the translation goes: under the last line of the range, relative to the container. */
export function tagPosition(range: Range, container: HTMLElement): { top: number; left: number } | null {
  const rects = typeof range.getClientRects === "function" ? Array.from(range.getClientRects()) : []
  const last = rects.at(-1)
  if (!last) return null
  // start of the range's last line (one rect per word span, so take the leftmost on that line)
  const lineLeft = Math.min(...rects.filter((r) => Math.abs(r.bottom - last.bottom) < 4).map((r) => r.left))
  const box = container.getBoundingClientRect()
  return { top: last.bottom - box.top + 2, left: Math.max(0, lineLeft - box.left) }
}
