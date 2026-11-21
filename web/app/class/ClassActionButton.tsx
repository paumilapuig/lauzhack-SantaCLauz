import { CircleHelp, Rewind } from "lucide-react";

const ACTIONS = {
  unclear: { label: "Je n'ai pas compris", Icon: Rewind, className: "bg-primary hover:bg-primary/90" },
  lost: { label: "J'ai perdu le fil", Icon: CircleHelp, className: "bg-lost hover:bg-lost/90" },
};

/** Full-height class button, labelled in French (the language the student is learning). */
export function ClassActionButton({ action, onPress }: { action: keyof typeof ACTIONS; onPress: () => void }) {
  const { label, Icon, className } = ACTIONS[action];
  return (
    <button
      type="button"
      onClick={onPress}
      className={`flex h-full min-h-40 flex-col items-center justify-center gap-4 rounded-lg p-6 text-3xl font-bold text-white transition-transform active:scale-[0.98] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ring md:text-5xl ${className}`}
    >
      <Icon className="size-12 md:size-16" aria-hidden />
      {label}
    </button>
  );
}
