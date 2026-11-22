import styles from "./LiveSubtitles.module.css";
import { SUBTITLE_IDLE_SEC } from "./subtitleLines";

/**
 * One big subtitle line. Newest words stay at the right edge; older words slide off the left.
 * Remounting on every text change restarts the fade, so the line disappears after a silence.
 */
export function LiveSubtitles({ text, visible }: { text: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      aria-live="polite"
      lang="fr"
      className="flex h-20 items-center justify-end overflow-hidden rounded-[24px] border border-border bg-card px-6 [mask-image:linear-gradient(to_right,transparent,black_15%)] md:h-28 md:px-8"
    >
      {text && (
        <p
          key={text}
          className={`${styles.fading} whitespace-nowrap text-[32px] font-bold tracking-[-0.03em] text-foreground md:text-[52px]`}
          style={{ animationDuration: `${SUBTITLE_IDLE_SEC}s` }}
        >
          {text}
        </p>
      )}
    </div>
  );
}
