import type { ReactNode } from "react"
import { PageTitle } from "./page-title"
import { StudentShell } from "./student-shell"

type StudentPageProps = {
  title: string
  context?: string
  lead?: string
  wide?: boolean
  children: ReactNode
}

export function StudentPage({ title, context, lead, wide = false, children }: StudentPageProps) {
  return (
    <StudentShell>
      <div className={`mx-auto w-full max-w-[1200px] px-5 pb-28 pt-8 lg:px-8 lg:pb-16 lg:pt-10`}>
        <header className={`mb-10 flex flex-col gap-2 ${wide ? "" : "max-w-[720px]"}`}>
          <PageTitle title={title} context={context} />
          {lead && <p className="max-w-[36em] text-[16px] leading-6 text-label-secondary">{lead}</p>}
        </header>
        <main
          className={
            wide
              ? "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-400"
              : "max-w-[720px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-400"
          }
        >
          {children}
        </main>
      </div>
    </StudentShell>
  )
}
