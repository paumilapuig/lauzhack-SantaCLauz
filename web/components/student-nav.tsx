"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpenText, Sprout } from "lucide-react"

const LINKS = [
  { href: "/home", label: "Repasar", Icon: BookOpenText },
  { href: "/progress", label: "Mi progreso", Icon: Sprout },
]

export function StudentNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Alumna" className="inline-flex rounded-full border border-border bg-card p-1">
      {LINKS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-base text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:bg-foreground aria-[current=page]:font-bold aria-[current=page]:text-background"
        >
          <Icon aria-hidden className="size-[18px]" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
