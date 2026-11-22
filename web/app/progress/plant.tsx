import styles from "./garden.module.css"

const SOIL = "#D9D9D9"
const SEED = "#8A5300"
const LEAF_GROWING = "#F47D31" // orange = still learning
const LEAF_GROWN = "#027E6F" // teal = no help needed
const PETAL = "#F47D31"
const HEART = "#FFF4D1"

/** Her word as a plant: level 0 a seed, 1 a sprout, 2 in leaf, 3 in flower. Pure drawing, no text. */
export function Plant({ level, index = 0 }: { level: number; index?: number }) {
  const leaf = level >= 2 ? LEAF_GROWN : LEAF_GROWING
  const delay = { animationDelay: `${index * 70}ms` }
  return (
    <svg viewBox="0 0 64 64" aria-hidden className="size-20" style={delay}>
      <ellipse cx="32" cy="56" rx="20" ry="5" fill={SOIL} />
      {level <= 0 && <ellipse className={styles.pop} style={delay} cx="32" cy="52" rx="5" ry="3.5" fill={SEED} />}
      {level >= 1 && (
        <g className={styles.grow} style={delay}>
          <path d={`M32 55 V${level >= 2 ? 22 : 38}`} stroke={leaf} strokeWidth="3" strokeLinecap="round" />
          <path d="M32 44 C24 44 20 38 20 34 C26 34 31 38 32 44 Z" fill={leaf} />
          <path d="M32 40 C40 40 44 34 44 30 C38 30 33 34 32 40 Z" fill={leaf} />
          {level >= 2 && (
            <>
              <path d="M32 32 C25 32 21 27 21 23 C27 23 31 27 32 32 Z" fill={leaf} />
              <path d="M32 28 C39 28 43 23 43 19 C37 19 33 23 32 28 Z" fill={leaf} />
            </>
          )}
        </g>
      )}
      {level >= 3 && (
        <g className={styles.bloom} style={{ animationDelay: `${index * 70 + 350}ms` }}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse key={angle} cx="32" cy="10" rx="4.5" ry="6.5" fill={PETAL} transform={`rotate(${angle} 32 16)`} />
          ))}
          <circle cx="32" cy="16" r="4" fill={HEART} />
        </g>
      )}
    </svg>
  )
}
