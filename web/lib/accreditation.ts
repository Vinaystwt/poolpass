"use client";

import { randomFr, fieldToHex } from "./zk/field";
import { computeLeaf } from "./zk/poseidon";
import { accredit } from "./api";
import type { ProofPackage } from "./zk/types";
import { CONTRACTS } from "./backend-config";

const STORAGE_KEY = "poolpass-proof-package";

export interface Identity {
  investorId: bigint;
  cap: bigint;
  investorSecret: bigint;
}

/**
 * Generate a fresh investor identity locally. investor_id and investor_secret are
 * random BN254 Fr values; cap is a generous test ceiling. None of these leave the
 * device — only the resulting leaf hash is sent to /accredit.
 */
export function generateIdentity(capBaseUnits = 100_000_000_000n): Identity {
  return { investorId: randomFr(), cap: capBaseUnits, investorSecret: randomFr() };
}

/** Compute the leaf and request a Merkle path via the self-serve /accredit route. */
export async function requestSelfServeAccreditation(
  identity: Identity,
  amountBaseUnits: string,
): Promise<ProofPackage> {
  const leaf = await computeLeaf(identity.investorId, identity.cap, identity.investorSecret);
  const res = await accredit(fieldToHex(leaf));
  const pkg: ProofPackage = {
    investor_id: identity.investorId.toString(),
    cap: identity.cap.toString(),
    investor_secret: identity.investorSecret.toString(),
    leaf: leaf.toString(),
    root: res.root,
    index: res.index,
    merkle_path: res.merkle_path,
    merkle_indices: res.merkle_indices,
    epoch: res.epoch,
    amount: amountBaseUnits,
    poolContractId: CONTRACTS.poolpass,
    label: "Self-serve test accreditation",
  };
  return pkg;
}

export function savePackage(pkg: ProofPackage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pkg));
  } catch {
    /* ignore */
  }
}

export function loadPackage(): ProofPackage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProofPackage) : null;
  } catch {
    return null;
  }
}
