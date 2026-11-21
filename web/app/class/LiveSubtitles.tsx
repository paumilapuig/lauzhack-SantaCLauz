import styles from "./LiveSubtitles.module.css";
import { SUBTITLE_IDLE_SEC } from "./subtitleLines";

/**
 * One big subtitle line. Newest words stay at the right edge; older words slide off the left.
 * Remounting on every text change restarts the fade, so the line disappears after a silence.
 */
export function LiveSubtitles({ text, visible }: { text: string; visible: boolean }) {
  return (
    <div
      aria-live="polite"
      className="flex h-20 items-center justify-end overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%)] md:h-24"
    >
      {visible && text && (
        <p
          key={text}
          className={`${styles.fading} whitespace-nowrap text-4xl font-bold md:text-6xl`}
          style={{ animationDuration: `${SUBTITLE_IDLE_SEC}s` }}
        >
          {text}
        </p>
      )}
    </div>
  );
}
