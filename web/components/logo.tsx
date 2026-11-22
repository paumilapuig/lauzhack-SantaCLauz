import { cn } from "@/lib/utils"

// Geometry measured on loopd-icon-1024.png (also app/icon.png): two rings of radius ~149 with a 92 hole,
// centres 266 apart; the ink ring sits on top where they cross.
const RADIUS = 120.5
const STROKE = 57

/** The Loop'd mark: an orange ring (learning) linked to an ink ring. Decorative: the name is next to it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="228 362 568 300" aria-hidden="true" className={cn("h-4 w-auto shrink-0", className)}>
      <circle cx="379" cy="512" r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-brand-orange" />
      <circle cx="645" cy="512" r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-heading" />
    </svg>
  )
}

/** Mark + name, as in the top bars and the login page. */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-[-0.02em]", className)}>
      <LogoMark className={markClassName} />
      Loop&apos;d
    </span>
  )
}
