// Helpers for the gift's secret word. These must stay in lock-step with the
// on-chain validator: it stores `sha2_256(secret_bytes)` and, on claim, checks
// `sha2_256(answer_bytes) == secret_hash`. Both sides therefore hash the UTF-8
// bytes of the *normalized* word, so normalization has to be identical.

/** Normalize a word so create/claim hash the same value: trim, lowercase, and
 *  collapse internal whitespace. */
export function normalizeSecret(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

function utf8ToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** sha2-256 of the normalized secret's UTF-8 bytes, as lowercase hex. Stored in
 *  the datum as `secret_hash`. */
export async function hashSecret(word: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalizeSecret(word));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Hex of the normalized secret's UTF-8 bytes — the `answer` carried in the
 *  Claim redeemer. */
export function secretToAnswerHex(word: string): string {
  return utf8ToHex(normalizeSecret(word));
}

/** Fisher–Yates shuffle of a word's characters, for the claim-page puzzle hint.
 *  Only the letter multiset is revealed, never the original order. */
export function scrambleWord(word: string): string[] {
  const chars = Array.from(normalizeSecret(word));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
}
