/** A gift's off-chain metadata, mirroring a row in the `gifts` table. */
export interface Gift {
  /** Lock transaction hash — the gift's identifier. */
  lockTxHash: string;
  /** Shareable gift code, if the client provided one. */
  code: string | null;
  /** Creator's address. */
  ownerAddress: string;
  title: string | null;
  message: string | null;
  /** Scrambled characters of the secret word (the puzzle hint). */
  hint: string[];
  /** sha2-256 of the secret (public; in the datum too). */
  secretHash: string | null;
  totalEnvelopes: number;
  /** Total locked, in lovelace (string to stay exact). */
  totalLovelace: string;
  /** Refund deadline, POSIX milliseconds. */
  deadlineMs: number;
  network: string;
  createdAt: number;
}

/** A recorded claim against a gift, mirroring a row in the `claims` table. */
export interface Claim {
  id: string;
  lockTxHash: string;
  claimerName: string | null;
  claimerAddress: string;
  claimTxHash: string;
  amountLovelace: string;
  createdAt: number;
}
