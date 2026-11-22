"use client"

import { BookOpen, Mic, Sprout } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/class", label: "Class", Icon: Mic },
  { href: "/home", label: "Review", Icon: BookOpen },
  { href: "/progress", label: "Progress", Icon: Sprout },
]

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"

const VARIANTS = {
  tabbar: {
    nav: "fixed inset-x-0 bottom-0 z-10 flex h-[calc(56px+env(safe-area-inset-bottom))] border-t border-separator bg-card pb-[env(safe-area-inset-bottom)] lg:hidden",
    link: `flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-[12px] font-medium text-label-secondary transition-colors aria-[current=page]:text-primary ${FOCUS}`,
    icon: "size-6",
  },
  topbar: {
    nav: "flex items-center gap-1",
    link: `inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-label transition-colors hover:bg-fill sm:h-10 sm:gap-2 sm:px-4 sm:text-[15px] aria-[current=page]:bg-charcoal aria-[current=page]:text-primary-foreground ${FOCUS}`,
    icon: "size-3.5 sm:size-4 text-label-secondary group-aria-[current=page]:text-primary-foreground",
  },
}

export function StudentNav({ variant }: { variant: "topbar" | "tabbar" }) {
  const pathname = usePathname()
  const styles = VARIANTS[variant]
  return (
    <nav aria-label={variant === "tabbar" ? "Student" : "Student, top"} className={styles.nav}>
      {LINKS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`group ${styles.link}`}>
          <Icon aria-hidden="true" strokeWidth={1.75} className={styles.icon} />
          <span className={variant === "topbar" ? "max-[380px]:sr-only" : undefined}>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
