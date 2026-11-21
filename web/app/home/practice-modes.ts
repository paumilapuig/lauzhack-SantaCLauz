import { Blocks, FileText, Layers, Link2, ListChecks, Route, Volume2 } from "lucide-react"
import type { ComponentType } from "react"
import { Dictation } from "./exercises/dictation"
import { Flashcards } from "./exercises/flashcards"
import { MatchPairs } from "./exercises/match-pairs"
import { OrderPhrase } from "./exercises/order-phrase"
import { StepByStep } from "./exercises/step-by-step"
import { TrueFalse } from "./exercises/true-false"
import type { ExerciseProps } from "./exercises/types"
import { Unscramble } from "./exercises/unscramble"
import type { PracticeModeItem } from "./practice-modes-list"

export type PracticeMode = PracticeModeItem & { Component: ComponentType<ExerciseProps> }

export const PRACTICE_MODES: PracticeMode[] = [
  { id: "flashcards", needs: ["translation"], name: "Tarjetas", description: "Voltea y recuerda", icon: Layers, minWords: 1, Component: Flashcards },
  { id: "match-pairs", needs: ["translation"], name: "Parejas", description: "Une cada palabra con su pareja", icon: Link2, minWords: 2, Component: MatchPairs },
  { id: "dictation", needs: [], name: "Dictado", description: "Escribe lo que oyes", icon: Volume2, minWords: 1, Component: Dictation },
  { id: "unscramble", needs: ["translation"], name: "Letras", description: "Ordena las letras", icon: Blocks, minWords: 1, Component: Unscramble },
  { id: "order-phrase", needs: ["phrase"], name: "Ordena la frase", description: "Ordena la frase del clip", icon: FileText, minWords: 1, Component: OrderPhrase },
  { id: "true-false", needs: ["definition"], name: "¿Verdadero o falso?", description: "Decide si es cierto", icon: ListChecks, minWords: 2, Component: TrueFalse },
  { id: "step-by-step", needs: ["phrase"], name: "Paso a paso", description: "Completa la frase poco a poco", icon: Route, minWords: 1, Component: StepByStep },
]
