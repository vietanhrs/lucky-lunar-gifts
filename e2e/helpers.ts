/** Build a Lucky ADA gift code (base64url JSON) the same way the client does,
 *  so the claim page can render its puzzle hint without any wallet or network. */
export function makeGiftCode(opts: {
  txHash?: string;
  hint: string[];
  deadlineMs?: number;
}): string {
  const payload = {
    t: opts.txHash ?? "a".repeat(64),
    h: opts.hint,
    d: opts.deadlineMs ?? 0,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}
