"use client"

import { BookOpen, Sprout } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/home", label: "Repasar", Icon: BookOpen },
  { href: "/progress", label: "Progreso", Icon: Sprout },
]

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"

const VARIANTS = {
  tabbar: {
    nav: "fixed inset-x-0 bottom-0 z-10 flex h-[calc(56px+env(safe-area-inset-bottom))] border-t border-separator bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden",
    link: `flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-[12px] font-medium text-label-secondary transition-colors aria-[current=page]:text-primary ${FOCUS}`,
    icon: "size-6",
  },
  sidebar: {
    nav: "hidden flex-col gap-1 lg:flex",
    link: `flex h-9 items-center gap-3 rounded-lg px-3 text-[15px] text-label transition-colors hover:bg-fill aria-[current=page]:bg-fill aria-[current=page]:font-medium ${FOCUS}`,
    icon: "size-[18px] text-label-secondary group-aria-[current=page]:text-primary",
  },
}

export function StudentNav({ variant }: { variant: "sidebar" | "tabbar" }) {
  const pathname = usePathname()
  const styles = VARIANTS[variant]
  return (
    <nav aria-label={variant === "tabbar" ? "Alumna" : "Alumna, lateral"} className={styles.nav}>
      {LINKS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`group ${styles.link}`}>
          <Icon aria-hidden="true" strokeWidth={1.5} className={styles.icon} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
