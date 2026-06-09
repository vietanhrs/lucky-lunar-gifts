import {
  type BrowserWallet,
  deserializeAddress,
  mConStr0,
  mConStr1,
  SLOT_CONFIG_NETWORK,
  unixTimeToEnclosingSlot,
  type UTxO,
} from "@meshsdk/core";
import {
  GIFT_SCRIPT_ADDRESS,
  GIFT_SCRIPT_CBOR,
  getProvider,
  getTxBuilder,
  NETWORK,
} from "./cardano";
import { decodeGiftCode, encodeGiftCode } from "./giftCode";
import { hashSecret, scrambleWord, secretToAnswerHex } from "./secret";

const LOVELACE_PER_ADA = 1_000_000;

export function adaToLovelace(ada: number): string {
  return Math.round(ada * LOVELACE_PER_ADA).toString();
}

export function lovelaceToAda(lovelace: bigint | number | string): number {
  return Number(lovelace) / LOVELACE_PER_ADA;
}

/** POSIX milliseconds, `days` from now — used as the default refund deadline. */
export function daysFromNow(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

export interface CreateGiftParams {
  /** The secret word recipients must guess. */
  secret: string;
  /** One entry per envelope; the ADA amount locked in each. */
  envelopeAmountsAda: number[];
  /** Refund deadline in POSIX milliseconds. */
  deadlineMs: number;
}

export interface CreateGiftResult {
  /** Lock transaction hash. */
  txHash: string;
  /** Shareable gift code (encodes tx hash, puzzle hint and deadline). */
  code: string;
}

/**
 * Build, sign and submit the lock transaction: one script UTxO per envelope,
 * each carrying the same `GiftDatum { secret_hash, owner, deadline }`.
 */
export async function createGift(
  wallet: BrowserWallet,
  { secret, envelopeAmountsAda, deadlineMs }: CreateGiftParams,
): Promise<CreateGiftResult> {
  if (envelopeAmountsAda.length === 0) {
    throw new Error("Add at least one envelope.");
  }

  const secretHash = await hashSecret(secret);
  const changeAddress = await wallet.getChangeAddress();
  const owner = deserializeAddress(changeAddress).pubKeyHash;

  // GiftDatum { secret_hash: ByteArray, owner: VerificationKeyHash, deadline: Int }
  const datum = mConStr0([secretHash, owner, deadlineMs]);

  const txBuilder = getTxBuilder();
  for (const ada of envelopeAmountsAda) {
    txBuilder
      .txOut(GIFT_SCRIPT_ADDRESS, [
        { unit: "lovelace", quantity: adaToLovelace(ada) },
      ])
      .txOutInlineDatumValue(datum);
  }

  const utxos = await wallet.getUtxos();
  const unsignedTx = await txBuilder
    .changeAddress(changeAddress)
    .selectUtxosFrom(utxos)
    .complete();

  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);

  const code = encodeGiftCode({
    t: txHash,
    h: scrambleWord(secret),
    d: deadlineMs,
  });

  return { txHash, code };
}

export interface GiftEnvelopes {
  utxos: UTxO[];
  count: number;
  totalLovelace: bigint;
}

function sumLovelace(utxos: UTxO[]): bigint {
  let total = 0n;
  for (const u of utxos) {
    for (const a of u.output.amount) {
      if (a.unit === "lovelace") total += BigInt(a.quantity);
    }
  }
  return total;
}

/** Find the still-unclaimed envelope UTxOs for a gift (those produced by its
 *  lock transaction and still sitting at the script address). */
export async function getGiftEnvelopes(code: string): Promise<GiftEnvelopes> {
  const { t: lockTxHash } = decodeGiftCode(code);
  const provider = getProvider();
  const scriptUtxos = await provider.fetchAddressUTxOs(GIFT_SCRIPT_ADDRESS);
  const utxos = scriptUtxos.filter((u) => u.input.txHash === lockTxHash);
  return { utxos, count: utxos.length, totalLovelace: sumLovelace(utxos) };
}

function addCollateral(
  txBuilder: ReturnType<typeof getTxBuilder>,
  collateral: UTxO[],
): void {
  if (!collateral || collateral.length === 0) {
    throw new Error(
      "Your wallet has no collateral set. Set a collateral UTxO in your wallet, then try again.",
    );
  }
  const c = collateral[0];
  txBuilder.txInCollateral(
    c.input.txHash,
    c.input.outputIndex,
    c.output.amount,
    c.output.address,
  );
}

/**
 * Claim a gift: spend its envelope UTxOs with the `Claim { answer }` redeemer,
 * sending the ADA to the connected wallet. The validator only succeeds when
 * `sha2_256(answer) == secret_hash`, so a wrong answer fails at build/eval time.
 */
export async function claimGift(
  wallet: BrowserWallet,
  code: string,
  answer: string,
): Promise<string> {
  const { utxos } = await getGiftEnvelopes(code);
  if (utxos.length === 0) {
    throw new Error("No unclaimed envelopes were found for this gift.");
  }

  const claimant = await wallet.getChangeAddress();
  const redeemer = mConStr0([secretToAnswerHex(answer)]); // Claim { answer }

  const txBuilder = getTxBuilder();
  for (const u of utxos) {
    txBuilder
      .spendingPlutusScriptV3()
      .txIn(u.input.txHash, u.input.outputIndex, u.output.amount, u.output.address)
      .txInInlineDatumPresent()
      .txInRedeemerValue(redeemer)
      .txInScript(GIFT_SCRIPT_CBOR);
  }

  addCollateral(txBuilder, await wallet.getCollateral());

  const unsignedTx = await txBuilder
    .changeAddress(claimant)
    .selectUtxosFrom(await wallet.getUtxos())
    .complete();

  const signedTx = await wallet.signTx(unsignedTx);
  return wallet.submitTx(signedTx);
}

/**
 * Refund a gift: the owner reclaims any unclaimed envelopes after the deadline,
 * using the `Refund` redeemer. The tx is owner-signed and its validity range
 * starts after the deadline, as the validator requires.
 */
export async function refundGift(
  wallet: BrowserWallet,
  code: string,
): Promise<string> {
  const { d: deadlineMs } = decodeGiftCode(code);
  if (!deadlineMs) {
    throw new Error("This gift code has no deadline, so it cannot be refunded.");
  }
  if (Date.now() < deadlineMs) {
    throw new Error("The refund deadline has not passed yet.");
  }

  const { utxos } = await getGiftEnvelopes(code);
  if (utxos.length === 0) {
    throw new Error("Nothing left to refund for this gift.");
  }

  const owner = await wallet.getChangeAddress();
  const ownerHash = deserializeAddress(owner).pubKeyHash;
  const redeemer = mConStr1([]); // Refund

  // The validator requires the validity range to start on/after the deadline.
  // The enclosing slot can begin slightly before `deadlineMs`, so step one slot
  // forward to guarantee `lower_bound >= deadline`.
  const slot =
    unixTimeToEnclosingSlot(deadlineMs, SLOT_CONFIG_NETWORK[NETWORK]) + 1;

  const txBuilder = getTxBuilder();
  for (const u of utxos) {
    txBuilder
      .spendingPlutusScriptV3()
      .txIn(u.input.txHash, u.input.outputIndex, u.output.amount, u.output.address)
      .txInInlineDatumPresent()
      .txInRedeemerValue(redeemer)
      .txInScript(GIFT_SCRIPT_CBOR);
  }

  addCollateral(txBuilder, await wallet.getCollateral());

  const unsignedTx = await txBuilder
    .invalidBefore(slot)
    .requiredSignerHash(ownerHash)
    .changeAddress(owner)
    .selectUtxosFrom(await wallet.getUtxos())
    .complete();

  const signedTx = await wallet.signTx(unsignedTx);
  return wallet.submitTx(signedTx);
}
