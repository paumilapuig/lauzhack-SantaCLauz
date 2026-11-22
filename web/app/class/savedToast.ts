import type { ButtonResult } from "./classButtons";

type Toaster = {
  success(message: string, options: object): void;
  error(message: string, options: object): void;
};

const SAVED_MESSAGE = { onUnclear: "Extrait enregistré", onLost: "Moment enregistré" };
const OPTIONS = { position: "top-left", duration: 2500 } as const;

/** Short side pop-up after a class button press; silent for ignored double presses. */
export function announceResult(toast: Toaster, action: keyof typeof SAVED_MESSAGE, result: ButtonResult | undefined) {
  if (result === "saved") toast.success(SAVED_MESSAGE[action], OPTIONS);
  else if (result === "failed") toast.error("Pas pu enregistrer", OPTIONS);
}
