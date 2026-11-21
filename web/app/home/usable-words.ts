import type { MyWord } from "./types"

export type Need = "translation" | "definition" | "phrase"

const FIELD: Record<Need, keyof MyWord> = {
  translation: "translation_es",
  definition: "definition_fr",
  phrase: "key_phrase",
}

export function usableWords(words: MyWord[], needs: Need[]): MyWord[] {
  return words.filter((w) => needs.every((need) => (w[FIELD[need]] as string).trim() !== ""))
}
