// A "gift code" is the shareable string a sender hands to recipients. It is a
// base64url-encoded JSON payload carrying everything the claim page needs WITHOUT
// a backend:
//
//   - `t`: the lock transaction hash, used to locate this gift's envelope UTxOs
//          at the script address.
//   - `h`: the scrambled characters of the secret word (the anagram puzzle hint).
//          Only the letter multiset travels, never the solution order.
//   - `d`: the refund deadline (POSIX ms), so the owner can build a refund tx.
//
// The secret word itself is never included, so possessing a code does not let
// you claim — you still have to solve the puzzle, and the contract verifies it.

export interface GiftCodePayload {
  /** Lock transaction hash. */
  t: string;
  /** Scrambled characters of the secret word (puzzle hint). */
  h: string[];
  /** Refund deadline, POSIX milliseconds. */
  d: number;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeGiftCode(payload: GiftCodePayload): string {
  const json = JSON.stringify(payload);
  return bytesToBase64url(new TextEncoder().encode(json));
}

/** Decode a gift code. Falls back to treating a bare 64-char hex string as a
 *  transaction hash (with no hint/deadline), so raw tx hashes still resolve. */
export function decodeGiftCode(code: string): GiftCodePayload {
  const trimmed = code.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return { t: trimmed.toLowerCase(), h: [], d: 0 };
  }
  try {
    const json = new TextDecoder().decode(base64urlToBytes(trimmed));
    const parsed = JSON.parse(json) as Partial<GiftCodePayload>;
    if (typeof parsed.t !== "string") throw new Error("missing tx hash");
    return {
      t: parsed.t,
      h: Array.isArray(parsed.h) ? parsed.h.map(String) : [],
      d: typeof parsed.d === "number" ? parsed.d : 0,
    };
  } catch {
    throw new Error("Invalid or unrecognized gift code.");
  }
}
