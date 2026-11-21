import { Inter } from "next/font/google"
import type { ReactNode } from "react"
import { StudentNav } from "./student-nav"

// SF Pro on Apple devices, Inter (closest free cut) everywhere else
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const SYSTEM =
  "[font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text',var(--font-inter),system-ui,sans-serif]"

export function StudentPage({ title, lead, children }: { title?: string; lead?: string; children: ReactNode }) {
  return (
    <div className={`${inter.variable} ${SYSTEM} student min-h-dvh w-full bg-background text-label antialiased`}>
      <div className="mx-auto w-full max-w-[1180px] px-5 pb-28 md:px-8 md:pb-16">
        <StudentNav />
        <main className="flex flex-col gap-10 pt-6 md:pt-10 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
          {title && (
            <div className="flex flex-col gap-2">
              <h1 className="text-balance text-[34px] leading-[41px] font-bold tracking-[-0.02em]">{title}</h1>
              <p className="text-[15px] leading-[20px] text-label-secondary">{lead}</p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
