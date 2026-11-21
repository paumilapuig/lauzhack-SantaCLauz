/** Small on/off slider for the live subtitles. */
export function SubtitleSwitch({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring"
    >
      Sous-titres
      <span
        aria-hidden
        className="relative h-6 w-11 rounded-full bg-muted-foreground/30 transition-colors group-aria-checked:bg-primary"
      >
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform group-aria-checked:translate-x-5" />
      </span>
    </button>
  );
}
