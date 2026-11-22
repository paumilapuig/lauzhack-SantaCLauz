import type { TopWord } from "../../teacher-contract";
import styles from "./dashboard.module.css";

/** The glossary words students marked most at home: yellow, like a hard word on their side. */
export function TopWordsCard({ words }: { words: TopWord[] }) {
  const max = Math.max(1, ...words.map((w) => w.taps));
  return (
    <section aria-labelledby="words-title" className="flex flex-col gap-5 rounded-[24px] border border-border bg-card p-5 md:p-7">
      <header className="flex flex-col gap-1">
        <p className="text-[12px] font-bold tracking-[0.06em] text-subtle uppercase">Words they marked</p>
        <h2 id="words-title" className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-heading">
          {words[0] ? <>«<span lang="fr">{words[0].lemma}</span>» is the hardest word</> : "No marked words yet"}
        </h2>
      </header>
      {words.length > 0 && (
        <ol className="flex flex-col gap-2">
          {words.map(({ lemma, taps }, i) => (
            <li key={lemma} className="relative flex h-10 items-center justify-between gap-3 overflow-hidden rounded-[10px] px-3">
              <span
                aria-hidden
                className={`absolute inset-y-0 left-0 rounded-[10px] bg-word-yellow-bg ${styles.growX}`}
                style={{ width: `${(taps / max) * 100}%`, "--i": i } as React.CSSProperties}
              />
              <span lang="fr" className="relative text-[16px] font-bold text-word-yellow">{lemma}</span>
              <span className="relative text-[14px] font-medium text-label-secondary tabular-nums">{taps === 1 ? "1 mark" : `${taps} marks`}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
