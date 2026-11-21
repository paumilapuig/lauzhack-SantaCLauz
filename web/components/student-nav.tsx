"use client"

import { BookOpen, Sprout } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/home", label: "Repasar", Icon: BookOpen },
  { href: "/progress", label: "Progreso", Icon: Sprout },
]

// Tab bar: fixed to the bottom on phones, a centered capsule at the top from md up
export function StudentNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Alumna"
      className="fixed inset-x-0 bottom-0 z-10 flex h-[calc(56px+env(safe-area-inset-bottom))] border-t border-separator bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:sticky md:inset-x-auto md:top-3 md:mx-auto md:h-auto md:w-fit md:rounded-full md:border-0 md:bg-fill/90 md:p-1 md:pb-1"
    >
      {LINKS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-[12px] font-medium text-label-secondary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[current=page]:text-primary md:h-10 md:flex-none md:flex-row md:gap-2 md:rounded-full md:px-5 md:text-[15px] md:font-semibold md:aria-[current=page]:bg-background md:aria-[current=page]:text-label md:aria-[current=page]:shadow-sm"
        >
          <Icon aria-hidden="true" className="size-6 md:size-[18px]" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
