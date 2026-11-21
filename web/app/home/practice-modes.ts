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
  { id: "flashcards", name: "Tarjetas", description: "Da la vuelta y comprueba qué sabes", icon: Layers, minWords: 1, Component: Flashcards },
  { id: "match-pairs", name: "Parejas", description: "Une cada palabra con su significado", icon: Link2, minWords: 2, Component: MatchPairs },
  { id: "dictation", name: "Dictado", description: "Escucha y escribe la palabra", icon: Volume2, minWords: 1, Component: Dictation },
  { id: "unscramble", name: "Letras", description: "Ordena las letras de la palabra", icon: Blocks, minWords: 1, Component: Unscramble },
  { id: "order-phrase", name: "Ordena la frase", description: "Reconstruye la frase de la clase", icon: FileText, minWords: 1, Component: OrderPhrase },
  { id: "true-false", name: "¿Verdadero o falso?", description: "¿Esta definición es de la palabra?", icon: ListChecks, minWords: 1, Component: TrueFalse },
  { id: "step-by-step", name: "Paso a paso", description: "Escucha, elige y di la palabra", icon: Route, minWords: 1, Component: StepByStep },
]
