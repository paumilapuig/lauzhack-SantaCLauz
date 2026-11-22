import type { ReactNode } from "react"
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
          <p className="flex items-center gap-2 text-[17px] font-bold tracking-[-0.02em]">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-brand-orange" />
            Loop&apos;d
          </p>
          <StudentNav variant="topbar" />
        </div>
      </header>

      {children}

      {bottom}
      {!hideTabbar && <StudentNav variant="tabbar" />}
    </div>
  )
}
