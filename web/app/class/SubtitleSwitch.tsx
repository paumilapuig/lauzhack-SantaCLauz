/** Small on/off slider for the live subtitles. */
export function SubtitleSwitch({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex min-h-11 items-center gap-2 rounded-full px-3 text-[15px] font-medium text-label hover:bg-fill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      Sous-titres
      <span
        aria-hidden
        className="relative h-6 w-11 rounded-full bg-input transition-colors duration-200 ease-out group-aria-checked:bg-charcoal"
      >
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-card shadow-[var(--shadow-subtle)] transition-transform duration-200 ease-out group-aria-checked:translate-x-5 motion-reduce:transition-none" />
      </span>
    </button>
  );
}
