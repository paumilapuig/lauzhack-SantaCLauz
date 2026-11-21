import { Inter } from "next/font/google"
import type { ReactNode } from "react"
import { StudentNav } from "./student-nav"
import { TodayLabel } from "./today-label"

// SF Pro on Apple devices, Inter (closest free cut) everywhere else
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const SYSTEM =
  "[font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text',var(--font-inter),system-ui,sans-serif]"

export function StudentPage({ title, lead, children }: { title?: string; lead?: string; children: ReactNode }) {
  return (
    <div className={`${inter.variable} ${SYSTEM} min-h-dvh w-full bg-white text-label antialiased`}>
      <div className="mx-auto w-full max-w-[980px] px-5 pb-24 md:px-8">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-separator">
          <StudentNav />
          <TodayLabel />
        </header>
        <main className="flex flex-col gap-16 pt-12 md:pt-16 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
          {title && (
          <div className="flex flex-col gap-2">
            <h1 className="text-balance text-[40px] leading-[1.08] font-semibold tracking-[-0.025em] md:text-[56px]">{title}</h1>
            <p className="text-[19px] leading-snug text-label-secondary md:text-[21px]">{lead}</p>
          </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
