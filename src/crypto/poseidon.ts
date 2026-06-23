import { buildPoseidon } from "circomlibjs";

import { assertCanonicalField } from "./field.js";

interface PoseidonField {
  toObject(value: unknown): bigint;
}

interface PoseidonFunction {
  (inputs: bigint[]): unknown;
  F: PoseidonField;
}

let instance: Promise<PoseidonFunction> | undefined;

async function getPoseidon(): Promise<PoseidonFunction> {
  instance ??= buildPoseidon() as Promise<PoseidonFunction>;
  return instance;
}

async function hash(inputs: bigint[]): Promise<bigint> {
  inputs.forEach(assertCanonicalField);
  const poseidon = await getPoseidon();
  return assertCanonicalField(poseidon.F.toObject(poseidon(inputs)));
}

export async function poseidon2(left: bigint, right: bigint): Promise<bigint> {
  return hash([left, right]);
}

export async function poseidon3(first: bigint, second: bigint, third: bigint): Promise<bigint> {
  return hash([first, second, third]);
}

