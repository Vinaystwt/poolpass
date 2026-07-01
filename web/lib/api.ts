"use client";

import type { AccreditationResponse, CircuitInput, SnarkProofResult } from "./zk/types";
import type { IndexerState } from "./indexer";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request to ${url} failed (${res.status})`);
  }
  return data as T;
}

/** Self-serve accreditation: send ONLY the leaf hash. */
export function accredit(leaf: string, poolId?: string): Promise<AccreditationResponse> {
  return postJson<AccreditationResponse>("/api/accredit", poolId ? { leaf, poolId } : { leaf });
}

export function faucet(address: string, amount?: string): Promise<{ hash?: string; txHash?: string }> {
  return postJson("/api/faucet", amount ? { address, amount } : { address });
}

export function verifyBackend(
  proof: SnarkProofResult["proof"],
  publicSignals: string[],
): Promise<{ valid: boolean }> {
  return postJson("/api/verify", { proof, publicSignals });
}

/** FALLBACK path, sends private inputs in plaintext. Requires explicit opt-in. */
export function proveBackend(input: CircuitInput): Promise<SnarkProofResult> {
  return postJson("/api/prove", { input });
}

export async function fetchEvents(): Promise<IndexerState & { source?: string }> {
  const res = await fetch("/api/events", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load indexer events");
  return res.json();
}

export async function fetchPoolDemo(): Promise<unknown> {
  const res = await fetch("/api/pool-demo", { cache: "no-store" });
  return res.json();
}

/** Real per-pool marketplace data from GET /pools (shape per FRONTEND_INTEGRATION.md). */
export interface PoolMarket {
  id: string;
  name: string;
  gateDescription: string;
  contractId: string;
  poolToken: string;
  issuer: string;
  vk: string;
  merkleDepth: number;
  leafCount: number;
  perInvestorCapPublic: string;
  totalSubscribed: string;
  epoch: number;
  currentRoot: string;
  subscriberCount: number;
  subscribedVolume: string;
}

export async function fetchPools(): Promise<PoolMarket[]> {
  const res = await fetch("/api/pools", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load pools");
  const data = await res.json();
  return (data.pools ?? []) as PoolMarket[];
}
