import { CircleHelp, Rewind } from "lucide-react";

const ACTIONS = {
  unclear: { label: "Je n'ai pas compris", Icon: Rewind, className: "bg-lost text-white hover:bg-lost/90" },
  lost: { label: "J'ai perdu le fil", Icon: CircleHelp, className: "bg-heading text-white hover:bg-heading/90" },
};

/** Full-height class button, labelled in French (the language the student is learning). */
export function ClassActionButton({ action, onPress }: { action: keyof typeof ACTIONS; onPress: () => void }) {
  const { label, Icon, className } = ACTIONS[action];
  return (
    <button
      type="button"
      onClick={onPress}
      className={`flex h-full min-h-40 flex-col items-center justify-center gap-4 rounded-[32px] p-6 text-[32px] leading-[1.1] font-bold tracking-[-0.03em] transition-[transform,background-color] duration-[120ms] ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:active:scale-100 md:text-[48px] ${className}`}
    >
      <Icon className="size-12 md:size-16" strokeWidth={1.75} aria-hidden />
      {label}
    </button>
  );
}
