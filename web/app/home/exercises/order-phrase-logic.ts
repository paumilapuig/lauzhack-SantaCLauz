export type Chip = { id: number; text: string };

export function phraseChips(phrase: string): Chip[] {
  return phrase.split(/\s+/).filter(Boolean).map((text, id) => ({ id, text }));
}

export function isRebuilt(chips: Chip[], placed: Chip[]): boolean {
  return placed.length === chips.length && placed.every((chip, i) => chip.text === chips[i].text);
}
