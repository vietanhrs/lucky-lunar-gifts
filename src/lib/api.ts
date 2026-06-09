// Typed client for the Lucky ADA backend service (see ../../server).
//
// The backend is OPTIONAL: it stores metadata that can't live on-chain (gift
// titles, messages, the puzzle hint, and claim records with claimer names). The
// chain remains the source of truth, so every call here is best-effort — when
// VITE_API_BASE_URL is unset or a request fails, the app falls back to its
// purely on-chain behavior.

import type { GiftRegistration } from "./gift";

const BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export function isBackendEnabled(): boolean {
  return BASE.length > 0;
}

export interface ApiGift {
  lockTxHash: string;
  code: string | null;
  ownerAddress: string;
  title: string | null;
  message: string | null;
  hint: string[];
  secretHash: string | null;
  totalEnvelopes: number;
  totalLovelace: string;
  deadlineMs: number;
  network: string;
  createdAt: number;
}

export interface ApiClaim {
  id: string;
  lockTxHash: string;
  claimerName: string | null;
  claimerAddress: string;
  claimTxHash: string;
  amountLovelace: string;
  createdAt: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export interface RegisterGiftInput extends GiftRegistration {
  title?: string;
  message?: string;
}

/** Register a gift's metadata after its lock tx is on-chain. */
export async function registerGift(input: RegisterGiftInput): Promise<ApiGift> {
  const { gift } = await request<{ gift: ApiGift }>("/api/gifts", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return gift;
}

/** Fetch a gift with its claims. Returns null if the backend doesn't have it. */
export async function fetchGift(
  lockTxHash: string,
): Promise<{ gift: ApiGift; claims: ApiClaim[] } | null> {
  try {
    return await request<{ gift: ApiGift; claims: ApiClaim[] }>(
      `/api/gifts/${lockTxHash}`,
    );
  } catch {
    return null;
  }
}

/** List gifts registered by a given owner address. */
export async function listGiftsByOwner(owner: string): Promise<ApiGift[]> {
  const { gifts } = await request<{ gifts: ApiGift[] }>(
    `/api/gifts?owner=${encodeURIComponent(owner)}`,
  );
  return gifts;
}

export interface RecordClaimInput {
  claimerName?: string;
  claimerAddress: string;
  claimTxHash: string;
  amountLovelace: string;
}

/** Record a claim's metadata after its tx is on-chain. */
export async function recordClaim(
  lockTxHash: string,
  input: RecordClaimInput,
): Promise<ApiClaim> {
  const { claim } = await request<{ claim: ApiClaim }>(
    `/api/gifts/${lockTxHash}/claims`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return claim;
}
