import { Kalam } from "next/font/google"
import type { ReactNode } from "react"

// Handwriting partner font: only for "pen" notes (Spanish glosses, small labels) at home
const kalam = Kalam({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-kalam" })

export function NotebookFont({ children }: { children: ReactNode }) {
  return <div className={kalam.variable}>{children}</div>
}
