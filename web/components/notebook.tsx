import type { ReactNode } from "react"
import { cn } from "cn"

// Font is loaded by NotebookFont (notebook-font.tsx) on the student pages
export const HAND = "font-[family-name:var(--font-kalam)]"

// Signature detail: an amber highlighter stroke behind key words
export function Highlight({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <span
      className={cn(
        "box-decoration-clone px-[0.1em]",
        strong
          ? "bg-[linear-gradient(transparent_62%,var(--marker-strong)_62%,var(--marker-strong)_88%,transparent_88%)]"
          : "bg-[linear-gradient(transparent_56%,var(--marker)_56%,var(--marker)_92%,transparent_92%)]",
      )}
    >
      {children}
    </span>
  )
}
