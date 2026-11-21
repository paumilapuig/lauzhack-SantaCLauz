import type { Mastery } from "./wordState";

export const fakeMastery: Mastery = {
  levels: {
    nourriture: 1,
    déchet: 0,
    rejeter: 0,
    dégager: 0,
    fournir: 0,
    chaleur: 0,
    essoufflé: 0,
    mitochondrie: 1,
  },
  previouslyTapped: ["nourriture", "déchet"],
};
