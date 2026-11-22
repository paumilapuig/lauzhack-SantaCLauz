import type { Species } from "./aquarium-layout"

const LEARNING = "#F47D31" // orange: still learning (level 1)
const LEARNED = "#027E6F" // teal: no help needed (level 2-3)
const EGG = "#FFF4D1"
const EGG_LINE = "#8A5300"
const EYE = "#0E101A"
const SPARKLE = "#FFCE00"

/** Level 0 an egg; 1 a small orange baby; 2 grown in teal; 3 bigger with a sparkle. Pure drawing, no text. */
export function SeaCreature({ species, level }: { species: Species; level: number }) {
  if (level <= 0) return <Egg />
  const color = level >= 2 ? LEARNED : LEARNING
  const size = level >= 3 ? 96 : level >= 2 ? 80 : 60
  return (
    <svg viewBox="0 0 80 60" width={size} height={size * 0.75} aria-hidden className="overflow-visible">
      {species === "fish" && <Fish color={color} />}
      {species === "shark" && <Shark color={color} />}
      {species === "jellyfish" && <Jellyfish color={color} />}
      {species === "starfish" && <Starfish color={color} />}
      {level >= 3 && <Sparkle />}
    </svg>
  )
}

function Egg() {
  return (
    <svg viewBox="0 0 40 30" width={40} height={30} aria-hidden>
      <ellipse cx="20" cy="17" rx="9" ry="11" fill={EGG} stroke={EGG_LINE} strokeWidth="2" />
      <circle cx="17" cy="14" r="1.6" fill={EGG_LINE} opacity="0.6" />
      <circle cx="23" cy="20" r="1.2" fill={EGG_LINE} opacity="0.6" />
    </svg>
  )
}

function Fish({ color }: { color: string }) {
  return (
    <g>
      <path d="M58 30 L76 16 L72 30 L76 44 Z" fill={color} />
      <ellipse cx="38" cy="30" rx="24" ry="15" fill={color} />
      <path d="M34 16 C40 8 48 10 50 17 Z" fill={color} />
      <path d="M30 30 C34 26 34 34 30 30" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" fill="none" />
      <circle cx="24" cy="26" r="3.5" fill="#FFFFFF" />
      <circle cx="23.5" cy="26" r="2" fill={EYE} />
    </g>
  )
}

function Shark({ color }: { color: string }) {
  return (
    <g>
      <path d="M62 30 L78 14 L74 30 L78 44 Z" fill={color} />
      <path d="M4 32 C14 18 46 16 66 28 C48 40 16 42 4 32 Z" fill={color} />
      <path d="M32 21 L40 4 L46 22 Z" fill={color} />
      <path d="M30 37 L36 48 L40 37 Z" fill={color} />
      <path d="M8 33 C14 36 20 36 26 34" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.7" />
      <circle cx="16" cy="27" r="2.2" fill={EYE} />
      <path d="M22 26 V32 M25 26 V32" stroke={EYE} strokeWidth="1.2" opacity="0.35" />
    </g>
  )
}

function Jellyfish({ color }: { color: string }) {
  return (
    <g>
      <path d="M18 30 C18 12 62 12 62 30 Z" fill={color} />
      <path d="M18 30 Q22 34 26 30 Q30 34 34 30 Q38 34 42 30 Q46 34 50 30 Q54 34 58 30 Q60 32 62 30" fill={color} />
      {[24, 32, 40, 48, 56].map((x, i) => (
        <path key={x} d={`M${x} 32 q${i % 2 ? 4 : -4} 8 0 14 q${i % 2 ? -4 : 4} 6 0 12`} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ))}
      <circle cx="33" cy="23" r="2.2" fill={EYE} />
      <circle cx="47" cy="23" r="2.2" fill={EYE} />
    </g>
  )
}

function Starfish({ color }: { color: string }) {
  return (
    <g>
      <path
        d="M40 4 L48 22 L68 23 L53 36 L58 56 L40 45 L22 56 L27 36 L12 23 L32 22 Z"
        fill={color}
        stroke={color}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {[[40, 16], [53, 28], [47, 44], [33, 44], [27, 28]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#FFFFFF" opacity="0.6" />
      ))}
      <circle cx="36" cy="30" r="1.8" fill={EYE} />
      <circle cx="44" cy="30" r="1.8" fill={EYE} />
    </g>
  )
}

function Sparkle() {
  return (
    <path d="M70 2 L72.5 8 L78 10 L72.5 12 L70 18 L67.5 12 L62 10 L67.5 8 Z" fill={SPARKLE} stroke="#FFFFFF" strokeWidth="1" />
  )
}
