import type { ConceptStep } from "@/lib/student-contract"

/** Newer concepts bring boxes or arrows for every step; older ones only a sentence and an emoji line. */
export const hasBoxDiagram = (steps: ConceptStep[]): boolean =>
  steps.some((step) => (step.nodes ?? []).length > 0) &&
  steps.every((step) => (step.nodes ?? []).length + (step.links ?? []).length > 0)

const MIN_SCALE = 0.6

/** Scale that fits the diagram in its container, text included; below the minimum the box scrolls instead. */
export function fitScale(containerWidth: number, diagramWidth: number): number {
  if (containerWidth <= 0 || diagramWidth <= 0) return 1
  return Math.min(1, Math.max(MIN_SCALE, Math.round((containerWidth / diagramWidth) * 100) / 100))
}
