// Browser Poseidon — mirrors src/crypto/poseidon.ts exactly (circomlibjs, BN254 Fr,
// two-input t=3/RF=8/RP=57, three-input t=4/RF=8/RP=56). Shared by the investor
// self-serve flow and the issuer Merkle builder.
import { buildPoseidon } from "circomlibjs";
import { assertCanonicalFr } from "./field";

interface PoseidonField {
  toObject(value: unknown): bigint;
}
interface PoseidonFunction {
  (inputs: bigint[]): unknown;
  F: PoseidonField;
}

let instance: Promise<PoseidonFunction> | undefined;

async function getPoseidon(): Promise<PoseidonFunction> {
  instance ??= buildPoseidon() as unknown as Promise<PoseidonFunction>;
  return instance;
}

async function hash(inputs: bigint[]): Promise<bigint> {
  inputs.forEach(assertCanonicalFr);
  const poseidon = await getPoseidon();
  return assertCanonicalFr(poseidon.F.toObject(poseidon(inputs)));
}

export async function poseidon2(left: bigint, right: bigint): Promise<bigint> {
  return hash([left, right]);
}
export async function poseidon3(a: bigint, b: bigint, c: bigint): Promise<bigint> {
  return hash([a, b, c]);
}

// Domain-specific helpers (FRONTEND_INTEGRATION.md circuit flow)
export async function computeLeaf(investorId: bigint, cap: bigint, secret: bigint): Promise<bigint> {
  return poseidon3(investorId, cap, secret);
}
export async function computeNullifier(secret: bigint, epoch: bigint): Promise<bigint> {
  return poseidon2(secret, epoch);
}
export async function computeCommitment(nullifier: bigint, amount: bigint, epoch: bigint): Promise<bigint> {
  return poseidon3(nullifier, amount, epoch);
}
