const MIN_SHARED_WORDS = 2;
const MIN_SHARED_SHARE = 0.5;

function words(text: string): string[] {
  return text
    .toLocaleLowerCase("fr")
    .replace(/[^\p{L}\p{N}'’ ]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Chrome sometimes sends each growing version of a sentence as "final" ("…très Jol", "…très jolie de la").
 * A new final that starts with most of the previous one is a revision of it, not a new sentence.
 */
export function isRevisionOf(previous: string, next: string): boolean {
  const before = words(previous);
  const after = words(next);
  let shared = 0;
  while (shared < before.length && shared < after.length && before[shared] === after[shared]) shared++;
  return shared >= MIN_SHARED_WORDS && shared >= before.length * MIN_SHARED_SHARE;
}
