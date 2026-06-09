import { ApiError } from "../lib/errors";
import { scriptAddress, type CardanoNetwork } from "../lib/address";
import { GIFT_SCRIPT_HASH } from "../contracts/giftScript";

export interface LockTxFacts {
  /** Whether the transaction exists on-chain. */
  exists: boolean;
  /** Number of outputs paying the gift script address. */
  scriptOutputCount: number;
  /** Sum of lovelace across those script outputs (string for exactness). */
  scriptOutputLovelace: string;
}

export interface ClaimTxFacts {
  /** Whether the claim transaction exists on-chain. */
  exists: boolean;
  /** Whether it consumes at least one output of the gift's lock transaction. */
  spendsGift: boolean;
}

/** What the API needs to know from chain state to verify gifts and claims. */
export interface ChainService {
  readonly scriptAddress: string;
  getLockTxFacts(lockTxHash: string): Promise<LockTxFacts>;
  getClaimTxFacts(lockTxHash: string, claimTxHash: string): Promise<ClaimTxFacts>;
}

interface BlockfrostAmount {
  unit: string;
  quantity: string;
}
interface BlockfrostUtxos {
  inputs: Array<{ tx_hash: string; address: string }>;
  outputs: Array<{ address: string; amount: BlockfrostAmount[] }>;
}

/** ChainService backed by the Blockfrost API. */
export class BlockfrostChainService implements ChainService {
  readonly scriptAddress: string;
  private readonly baseUrl: string;
  private readonly projectId: string;

  constructor(projectId: string, network: CardanoNetwork) {
    this.projectId = projectId;
    this.baseUrl = `https://cardano-${network}.blockfrost.io/api/v0`;
    this.scriptAddress = scriptAddress(GIFT_SCRIPT_HASH, network);
  }

  private async fetchUtxos(txHash: string): Promise<BlockfrostUtxos | null> {
    const res = await fetch(`${this.baseUrl}/txs/${txHash}/utxos`, {
      headers: { project_id: this.projectId },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new ApiError(502, `Blockfrost request failed (${res.status}).`);
    }
    return (await res.json()) as BlockfrostUtxos;
  }

  async getLockTxFacts(lockTxHash: string): Promise<LockTxFacts> {
    const utxos = await this.fetchUtxos(lockTxHash);
    if (!utxos) {
      return { exists: false, scriptOutputCount: 0, scriptOutputLovelace: "0" };
    }
    const scriptOutputs = utxos.outputs.filter(
      (o) => o.address === this.scriptAddress,
    );
    let lovelace = 0n;
    for (const out of scriptOutputs) {
      for (const a of out.amount) {
        if (a.unit === "lovelace") lovelace += BigInt(a.quantity);
      }
    }
    return {
      exists: true,
      scriptOutputCount: scriptOutputs.length,
      scriptOutputLovelace: lovelace.toString(),
    };
  }

  async getClaimTxFacts(
    lockTxHash: string,
    claimTxHash: string,
  ): Promise<ClaimTxFacts> {
    const utxos = await this.fetchUtxos(claimTxHash);
    if (!utxos) return { exists: false, spendsGift: false };
    const spendsGift = utxos.inputs.some((i) => i.tx_hash === lockTxHash);
    return { exists: true, spendsGift };
  }
}
