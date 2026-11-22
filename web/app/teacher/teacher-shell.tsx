import { LayoutList } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Teacher chrome: the same top bar as the student pages, with the lessons link and sign-out. */
export function TeacherShell({ children, demo = false }: { children: React.ReactNode; demo?: boolean }) {
  return (
    <div lang="en" className="min-h-dvh bg-background text-label antialiased">
      <header className="sticky top-0 z-20 border-b border-separator bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/teacher" className={`flex items-center gap-2 rounded-full text-[17px] font-bold tracking-[-0.02em] ${FOCUS}`}>
              <Logo />
            </Link>
            <span className="rounded-full bg-fill px-2.5 py-1 text-[12px] font-bold tracking-[0.04em] text-label-secondary uppercase">Teacher</span>
            {demo && <span className="hidden rounded-full bg-word-yellow-bg px-2.5 py-1 text-[12px] font-bold text-word-yellow sm:inline">Demo data</span>}
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/teacher"
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-medium hover:bg-fill ${FOCUS}`}
            >
              <LayoutList aria-hidden className="size-4 text-label-secondary" strokeWidth={1.75} />
              <span className="max-sm:sr-only">My courses</span>
            </Link>
            {!demo && (
              <form action="/auth/signout" method="post">
                <button type="submit" className={`h-10 rounded-full border border-border px-4 text-[15px] font-medium hover:bg-fill ${FOCUS}`}>
                  Sign out
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-5 pt-10 pb-24 lg:px-8">{children}</main>
    </div>
  );
}
