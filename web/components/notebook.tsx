import type { ReactNode } from "react"

// Font is loaded by NotebookFont (notebook-font.tsx) on the student pages
export const HAND = "font-[family-name:var(--font-kalam)]"

// Signature detail: an amber highlighter stroke behind key words
export function Highlight({ children }: { children: ReactNode }) {
  return (
    <span className="box-decoration-clone bg-[linear-gradient(transparent_56%,var(--marker)_56%,var(--marker)_92%,transparent_92%)] px-[0.1em]">
      {children}
    </span>
  )
}
