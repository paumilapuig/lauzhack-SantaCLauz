"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/home", label: "Repasar" },
  { href: "/progress", label: "Mi progreso" },
]

// iOS-style segmented control
export function StudentNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Alumna" className="inline-flex rounded-[10px] bg-fill-strong/70 p-[3px]">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className="flex h-[38px] min-w-28 items-center justify-center rounded-[8px] px-4 text-[15px] font-medium text-label-secondary transition-colors hover:text-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[current=page]:bg-white aria-[current=page]:text-label aria-[current=page]:shadow-[0_1px_3px_rgb(0_0_0/0.12),0_1px_1px_rgb(0_0_0/0.04)]"
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
