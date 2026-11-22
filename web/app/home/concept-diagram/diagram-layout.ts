import type { ConceptStep, DiagramNode } from "@/lib/student-contract"

/** Positions of a concept's process diagram in abstract units (the component scales them to fit). */
export type Box = DiagramNode & { step: number; column: number; x: number; y: number; w: number; h: number; zone: boolean }
export type Edge = { from: string; to: string; label: string | null; step: number; path: string; labelX: number; labelY: number }
export type DiagramLayout = { boxes: Box[]; edges: Edge[]; width: number; height: number }

const BOX_W = 220
const BOX_H = 64
const COLUMN_GAP = 110
const ROW_GAP = 28
const ZONE_PAD = 20
const ZONE_LABEL = 44
const MARGIN = 16

export function stepOfNode(steps: ConceptStep[]): Map<string, number> {
  const stepIndex = new Map<string, number>()
  steps.forEach((step, index) => (step.nodes ?? []).forEach((n) => stepIndex.set(n.id, index)))
  return stepIndex
}

function columns(nodes: DiagramNode[], links: { from: string; to: string }[]): Map<string, number> {
  const rank = new Map(nodes.map((n) => [n.id, 0]))
  const byId = new Map(nodes.map((n) => [n.id, n]))
  for (let round = 0; round < nodes.length; round++) {
    for (const { from, to } of links) {
      const target = byId.get(to)
      if (target?.inside) continue
      rank.set(to, Math.max(rank.get(to)!, rank.get(from)! + 1))
    }
  }
  const capped = new Map([...rank].map(([id, r]) => [id, Math.min(r, nodes.length - 1)]))
  for (const n of nodes) if (n.inside && byId.has(n.inside)) capped.set(n.id, capped.get(n.inside)!)
  return capped
}

function edgePath(a: Box, b: Box): Pick<Edge, "path" | "labelX" | "labelY"> {
  if (b.column > a.column) {
    const [x1, y1, x2, y2] = [a.x + a.w, a.y + a.h / 2, b.x, b.y + Math.min(b.h, BOX_H) / 2]
    const mid = (x1 + x2) / 2
    return { path: `M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`, labelX: mid, labelY: (y1 + y2) / 2 - 10 }
  }
  if (b.column < a.column) {
    const [x1, y1, x2, y2] = [a.x, a.y + a.h / 2, b.x + b.w, b.y + Math.min(b.h, BOX_H) / 2]
    const mid = (x1 + x2) / 2
    return { path: `M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`, labelX: mid, labelY: (y1 + y2) / 2 - 10 }
  }
  const down = b.y > a.y
  const [x, y1, y2] = [a.x + a.w / 2, down ? a.y + a.h : a.y, down ? b.y : b.y + b.h]
  return { path: `M${x} ${y1} L${x} ${y2}`, labelX: x + 12, labelY: (y1 + y2) / 2 }
}

const LABEL_W = 120
const LABEL_H = 26

/** Move an arrow label down while it would sit on an earlier label. */
function separateLabels(edges: Edge[]): Edge[] {
  const placed: Edge[] = []
  for (const edge of edges) {
    let labelY = edge.labelY
    const clashes = () =>
      placed.some((p) => p.label && Math.abs(p.labelX - edge.labelX) < LABEL_W && Math.abs(p.labelY - labelY) < LABEL_H)
    while (edge.label && clashes()) labelY += LABEL_H
    placed.push({ ...edge, labelY })
  }
  return placed
}

/** Boxes in columns that follow the arrows; a `place` with boxes inside becomes a zone around them. */
export function layoutDiagram(steps: ConceptStep[]): DiagramLayout {
  const stepOf = stepOfNode(steps)
  const nodes = steps.flatMap((s) => s.nodes ?? [])
  const ids = new Set(nodes.map((n) => n.id))
  const links = steps.flatMap((s, step) => (s.links ?? []).filter((l) => ids.has(l.from) && ids.has(l.to)).map((l) => ({ ...l, step })))
  if (nodes.length === 0) return { boxes: [], edges: [], width: 0, height: 0 }

  const column = columns(nodes, links)
  const boxes = new Map<string, Box>()
  const cursor = new Map<number, number>()
  const childrenOf = (id: string) => nodes.filter((n) => n.inside === id)
  const place = (n: DiagramNode) => {
    const col = column.get(n.id)!
    const x = MARGIN + col * (BOX_W + 2 * ZONE_PAD + COLUMN_GAP)
    const y = cursor.get(col) ?? MARGIN
    const children = n.kind === "place" ? childrenOf(n.id) : []
    if (children.length === 0) {
      boxes.set(n.id, { ...n, step: stepOf.get(n.id)!, column: col, x: x + ZONE_PAD, y, w: BOX_W, h: BOX_H, zone: false })
      cursor.set(col, y + BOX_H + ROW_GAP)
      return
    }
    let inner = y + ZONE_LABEL
    for (const child of children) {
      boxes.set(child.id, { ...child, step: stepOf.get(child.id)!, column: col, x: x + ZONE_PAD, y: inner, w: BOX_W, h: BOX_H, zone: false })
      inner += BOX_H + ROW_GAP
    }
    const h = inner - y - ROW_GAP + ZONE_PAD
    boxes.set(n.id, { ...n, step: stepOf.get(n.id)!, column: col, x, y, w: BOX_W + 2 * ZONE_PAD, h, zone: true })
    cursor.set(col, y + h + ROW_GAP)
  }
  for (const n of nodes) if (!(n.inside && ids.has(n.inside)) && !boxes.has(n.id)) place(n)

  const all = [...boxes.values()]
  const edges = separateLabels(
    links.map((l) => ({ from: l.from, to: l.to, label: l.fr, step: l.step, ...edgePath(boxes.get(l.from)!, boxes.get(l.to)!) })),
  )
  const width = Math.max(...all.map((b) => b.x + b.w)) + MARGIN
  const height = Math.max(...all.map((b) => b.y + b.h)) + MARGIN
  const zonesFirst = [...all.filter((b) => b.zone), ...all.filter((b) => !b.zone)]
  return { boxes: zonesFirst, edges, width, height }
}
