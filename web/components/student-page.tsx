import { Inter } from "next/font/google"
import type { ReactNode } from "react"
import { PageTitle } from "./page-title"
import { StudentNav } from "./student-nav"

// SF Pro on Apple devices, Inter (closest free cut) everywhere else
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const SYSTEM =
  "[font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text',var(--font-inter),system-ui,sans-serif]"

type StudentPageProps = { title: string; context?: string; sidebar?: ReactNode; children: ReactNode }

export function StudentPage({ title, context, sidebar, children }: StudentPageProps) {
  return (
    <div className={`${inter.variable} ${SYSTEM} student min-h-dvh w-full bg-background text-label antialiased lg:flex`}>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-separator px-4 pb-6 lg:flex">
        <p className="flex h-14 items-center px-3 text-[17px] font-semibold">Fondu</p>
        <StudentNav variant="sidebar" />
        {sidebar}
      </aside>
      <div className="w-full px-5 pb-28 lg:px-10 lg:pb-16">
        <main className="mx-auto flex max-w-[880px] flex-col gap-12 pt-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-400 lg:pt-10">
          <PageTitle title={title} context={context} />
          {children}
        </main>
      </div>
      <StudentNav variant="tabbar" />
    </div>
  )
}
