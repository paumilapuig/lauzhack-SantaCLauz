"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/home", label: "Repasar" },
  { href: "/progress", label: "Mi progreso" },
]

export function StudentNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Alumna" className="flex gap-6">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className="rounded-md py-3 text-muted-foreground aria-[current=page]:font-bold aria-[current=page]:text-primary aria-[current=page]:underline"
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
