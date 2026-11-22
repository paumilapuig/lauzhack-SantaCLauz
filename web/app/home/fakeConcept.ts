import type { ConceptGap, ConceptWordResult } from "@/lib/student-contract"
import { glossFor } from "./concept-diagram/words"

// Demo concept for offline mode: a real reply of the after-class call (Gemini 2.5 Flash Lite, prompt v4, Sun 22 Nov).
export const FAKE_CONCEPT: ConceptGap = {
  id: "g1…",
  lesson_title: "La respiration cellulaire",
  concept: "La respiration cellulaire utilise de l'oxygène",
  lemmas: ["respiration cellulaire", "cellule", "énergie", "glucose", "oxygène"],
  status: "pending",
  explanation: [
    {
      fr: "La cellule utilise la nourriture pour avoir de l'énergie.",
      es: "La célula usa la comida para tener energía.",
      nodes: [
        { id: "cell", fr: "La cellule", kind: "place", inside: null },
        { id: "food", fr: "La nourriture", kind: "input", inside: null },
        { id: "energy", fr: "L'énergie", kind: "output", inside: null },
      ],
      links: [{ from: "food", to: "cell", fr: "utilise" }, { from: "cell", to: "energy", fr: "produit" }],
      words: [{ fr: "cellule", es: "célula" }, { fr: "nourriture", es: "comida" }, { fr: "utilise", es: "usa" }, { fr: "produit", es: "produce" }],
    },
    {
      fr: "La respiration cellulaire fabrique l'énergie.",
      es: "La respiración celular fabrica la energía.",
      nodes: [{ id: "respiration", fr: "La respiration cellulaire", kind: "process", inside: "cell" }],
      links: [{ from: "respiration", to: "energy", fr: "crée" }],
      words: [{ fr: "respiration cellulaire", es: "respiración celular" }, { fr: "fabrique", es: "fabrica" }, { fr: "crée", es: "crea" }],
    },
    {
      fr: "La respiration cellulaire utilise de l'oxygène.",
      es: "La respiración celular usa oxígeno.",
      nodes: [{ id: "oxygen", fr: "L'oxygène", kind: "input", inside: null }],
      links: [{ from: "oxygen", to: "respiration", fr: "entre dans" }],
      words: [{ fr: "oxygène", es: "oxígeno" }, { fr: "entre dans", es: "entra en" }],
    },
  ],
  exercises: [
    { question: "La respiration cellulaire a besoin de quoi ?", options: ["De nourriture seulement", "D'oxygène", "D'eau"] },
    { question: "Qu'est-ce qui fabrique l'énergie dans la cellule ?", options: ["La nourriture", "L'oxygène", "La respiration cellulaire"] },
  ],
}

export const FAKE_CONCEPT_ANSWERS = [1, 2]

/** What the real API answers for a tapped word, from the demo concept's own word list. */
export function fakeConceptWord(word: string): ConceptWordResult {
  const glosses = FAKE_CONCEPT.explanation.flatMap((step) => step.words ?? [])
  return { word, lemma: null, translation_es: glossFor(word, glosses), level: null }
}
