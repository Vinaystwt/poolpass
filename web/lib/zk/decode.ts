// Poseidon-free helpers — safe to import without pulling circomlibjs into a bundle.
import { PUBLIC_INPUT_ORDER } from "../backend-config";
import type { DecodedPublicInputs, ProofPackage } from "./types";

/** Public signals are emitted in PUBLIC_INPUT_ORDER: [merkle_root, amount, nullifier, epoch]. */
export function decodePublicInputs(publicSignals: string[]): DecodedPublicInputs {
  const map = Object.fromEntries(PUBLIC_INPUT_ORDER.map((name, i) => [name, publicSignals[i]]));
  return {
    merkle_root: map.merkle_root,
    amount: map.amount,
    nullifier: map.nullifier,
    epoch: map.epoch,
  };
}

export function isProofPackage(value: unknown): value is ProofPackage {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.investor_id === "string" &&
    typeof v.cap === "string" &&
    typeof v.investor_secret === "string" &&
    typeof v.root === "string" &&
    Array.isArray(v.merkle_path) &&
    (v.merkle_path as unknown[]).length === 3 &&
    Array.isArray(v.merkle_indices) &&
    (v.merkle_indices as unknown[]).length === 3
  );
}
