import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const SIZES = { sm: "size-5 [&_svg]:size-3", md: "size-7 [&_svg]:size-4", lg: "size-12 [&_svg]:size-6" }

/** Teal circle with a white check: "you did it". Enters with a bounce. */
export function CheckBadge({ size = "md", tone = "teal", className }: { size?: keyof typeof SIZES; tone?: "teal" | "white"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 animate-pop items-center justify-center rounded-full",
        tone === "teal" ? "bg-primary text-primary-foreground" : "bg-card text-primary",
        SIZES[size],
        className,
      )}
    >
      <Check strokeWidth={3} />
    </span>
  )
}
