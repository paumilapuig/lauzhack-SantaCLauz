import { shuffle } from "./shuffle";

export type Tile = { id: number; char: string };

export function makeTiles(lemma: string, seed: number): Tile[] {
  return shuffle([...lemma].map((char, id) => ({ id, char })), seed);
}

export function spell(placed: Tile[]): string {
  return placed.map((t) => t.char).join("");
}
