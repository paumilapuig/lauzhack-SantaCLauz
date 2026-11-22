import Link from "next/link"
import type { ReactNode } from "react"
import { Logo } from "./logo"
import { StudentNav } from "./student-nav"

/** Shared chrome for Clase · Repasar · Progreso */
export function StudentShell({
  children,
  bottom,
  hideTabbar = false,
}: {
  children: ReactNode
  /** Optional fixed bottom slot (e.g. class action buttons) */
  bottom?: ReactNode
  hideTabbar?: boolean
}) {
  return (
    <div className="student min-h-dvh w-full bg-background text-label antialiased">
      <header className="sticky top-0 z-20 border-b border-separator bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full text-[17px] font-bold tracking-[-0.02em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Logo />
          </Link>
          <StudentNav variant="topbar" />
        </div>
      </header>

      {children}

      {bottom}
      {!hideTabbar && <StudentNav variant="tabbar" />}
    </div>
  )
}
