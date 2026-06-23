// Shared ZK types across the worker, investor flow, prove page, and issuer console.

/** Exact circuit signal set (matches circuits/example_input.json). */
export interface CircuitInput {
  merkle_root: string;
  amount: string;
  nullifier: string;
  epoch: string;
  investor_id: string;
  cap: string;
  investor_secret: string;
  merkle_path: [string, string, string];
  merkle_indices: [string, string, string];
}

/** Response shape of POST /accredit (decimal field strings). */
export interface AccreditationResponse {
  leaf: string;
  root: string;
  epoch: number;
  index: number;
  merkle_path: [string, string, string];
  merkle_indices: [number, number, number];
}

/**
 * The self-contained JSON an investor needs to prove. Bundles the locally-held
 * identity (private) with the accreditation path (from the issuer/API). This is
 * what the issuer console exports and what /prove accepts.
 */
export interface ProofPackage {
  // private identity (never sent to the server)
  investor_id: string;
  cap: string;
  investor_secret: string;
  // accreditation (Merkle membership)
  leaf: string;
  root: string;
  index: number;
  merkle_path: [string, string, string];
  merkle_indices: [number, number, number];
  // subscription parameters
  epoch: number;
  amount?: string; // 7-decimal base units; defaulted in UI if absent
  // provenance metadata (display only)
  poolContractId?: string;
  label?: string;
}

export interface SnarkProofResult {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[]; // [merkle_root, amount, nullifier, epoch]
}

/** Decoded, human-readable public inputs for display. */
export interface DecodedPublicInputs {
  merkle_root: string;
  amount: string;
  nullifier: string;
  epoch: string;
}

// ── Worker protocol ──────────────────────────────────────────────────────────
export type ProofStage = "idle" | "witness" | "prove" | "verify" | "done" | "error";

export interface ProveRequest {
  id: number;
  mode: "prove";
  input: CircuitInput;
  wasmUrl: string;
  zkeyUrl: string;
  vkUrl: string;
}

export interface VerifyRequest {
  id: number;
  mode: "verify";
  vkUrl: string;
  proof: SnarkProofResult["proof"];
  publicSignals: string[];
}

export type WorkerRequest = ProveRequest | VerifyRequest;

export type WorkerResponse =
  | { id: number; type: "stage"; stage: ProofStage }
  | {
      id: number;
      type: "result";
      result: SnarkProofResult;
      proofHex: string;
      publicSignalsHex: string[];
      proofBytesLen: number;
      verified: boolean;
      timings: { witnessMs: number; proveMs: number; verifyMs: number; totalMs: number };
    }
  | { id: number; type: "verified"; valid: boolean; verifyMs: number }
  | { id: number; type: "error"; message: string };
