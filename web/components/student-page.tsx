import type { ReactNode } from "react"
import { NotebookFont } from "./notebook-font"
import { StudentNav } from "./student-nav"
import { TodayLabel } from "./today-label"

export function StudentPage({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <NotebookFont>
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-16 md:px-8">
        <header className="flex items-center justify-between gap-4 py-5">
          <StudentNav />
          <TodayLabel />
        </header>
        <main className="flex flex-col gap-12 pt-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <div className="flex max-w-2xl flex-col gap-3">
            <h1 className="text-[40px] leading-[1.1] font-bold md:text-[52px]">{title}</h1>
            <p className="text-xl text-muted-foreground">{lead}</p>
          </div>
          {children}
        </main>
      </div>
    </NotebookFont>
  )
}
