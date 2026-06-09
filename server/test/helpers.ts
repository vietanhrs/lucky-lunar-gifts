import { createApp } from "../src/app";
import { createDb } from "../src/db";
import type {
  ChainService,
  ClaimTxFacts,
  LockTxFacts,
} from "../src/services/chain";

/** In-memory ChainService stub so tests need no network. */
export class FakeChainService implements ChainService {
  readonly scriptAddress = "addr_test1wtestscriptaddress";
  lockFacts = new Map<string, LockTxFacts>();
  claimFacts = new Map<string, ClaimTxFacts>();

  setLock(hash: string, facts: LockTxFacts) {
    this.lockFacts.set(hash.toLowerCase(), facts);
  }
  setClaim(claimTxHash: string, facts: ClaimTxFacts) {
    this.claimFacts.set(claimTxHash.toLowerCase(), facts);
  }

  async getLockTxFacts(lockTxHash: string): Promise<LockTxFacts> {
    return (
      this.lockFacts.get(lockTxHash.toLowerCase()) ?? {
        exists: false,
        scriptOutputCount: 0,
        scriptOutputLovelace: "0",
      }
    );
  }
  async getClaimTxFacts(
    _lockTxHash: string,
    claimTxHash: string,
  ): Promise<ClaimTxFacts> {
    return (
      this.claimFacts.get(claimTxHash.toLowerCase()) ?? {
        exists: false,
        spendsGift: false,
      }
    );
  }
}

export function setup() {
  const db = createDb(":memory:");
  const chain = new FakeChainService();
  const app = createApp({ db, chain, network: "preprod" });
  return { app, chain, db };
}

export const hex = (c: string) => c.repeat(64).slice(0, 64);

/** A valid gift registration body whose lock tx the fake chain will accept. */
export function validGift(overrides: Record<string, unknown> = {}) {
  return {
    lockTxHash: hex("a"),
    ownerAddress: "addr_test1qowner",
    title: "Tết lì xì",
    message: "Chúc mừng năm mới!",
    hint: ["h", "a", "p", "p", "y"],
    totalEnvelopes: 2,
    totalLovelace: "20000000",
    deadlineMs: 1_900_000_000_000,
    network: "preprod",
    ...overrides,
  };
}

export const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readJson = (res: Response): Promise<any> => res.json();
