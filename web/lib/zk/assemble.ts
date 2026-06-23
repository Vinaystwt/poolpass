// Pure helpers: turn a ProofPackage + chosen amount into the exact circuit input,
// and decode public signals for human display. No snarkjs here (cheap, UI-thread safe).
import { computeNullifier } from "./poseidon";
import type { CircuitInput, DecodedPublicInputs, ProofPackage } from "./types";
import { PUBLIC_INPUT_ORDER } from "../backend-config";

export async function assembleCircuitInput(pkg: ProofPackage, amountBaseUnits: string): Promise<CircuitInput> {
  const secret = BigInt(pkg.investor_secret);
  const epoch = BigInt(pkg.epoch);
  const nullifier = await computeNullifier(secret, epoch);
  return {
    merkle_root: pkg.root,
    amount: amountBaseUnits,
    nullifier: nullifier.toString(),
    epoch: pkg.epoch.toString(),
    investor_id: pkg.investor_id,
    cap: pkg.cap,
    investor_secret: pkg.investor_secret,
    merkle_path: pkg.merkle_path,
    merkle_indices: pkg.merkle_indices.map(String) as [string, string, string],
  };
}

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
