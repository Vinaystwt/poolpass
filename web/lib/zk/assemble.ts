// Assemble the exact circuit input from a ProofPackage. This module imports
// Poseidon (circomlibjs); poseidon-free decode helpers live in ./decode.
import { computeNullifier } from "./poseidon";
import type { CircuitInput, ProofPackage } from "./types";

// Re-exported for back-compat; defined in the poseidon-free ./decode module.
export { decodePublicInputs, isProofPackage } from "./decode";

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

