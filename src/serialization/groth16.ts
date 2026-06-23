import { BN254_FR_MODULUS } from "../crypto/field.js";

export const BN254_FP_MODULUS =
  21888242871839275222246405745257275088696311157297823662689037894645226208583n;

type Numberish = string | bigint | number;
export type SnarkjsG1 = readonly [Numberish, Numberish, ...Numberish[]];
export type SnarkjsG2 = readonly [
  readonly [Numberish, Numberish],
  readonly [Numberish, Numberish],
  ...ReadonlyArray<readonly [Numberish, Numberish]>
];

export interface SnarkjsProof {
  pi_a: SnarkjsG1;
  pi_b: SnarkjsG2;
  pi_c: SnarkjsG1;
  protocol?: string;
  curve?: string;
}

export interface SnarkjsVerificationKey {
  vk_alpha_1: SnarkjsG1;
  vk_beta_2: SnarkjsG2;
  vk_gamma_2: SnarkjsG2;
  vk_delta_2: SnarkjsG2;
  IC: SnarkjsG1[];
}

function canonical(value: Numberish, modulus: bigint): bigint {
  const parsed = BigInt(value);
  if (parsed < 0n || parsed >= modulus) {
    throw new RangeError(`Value is not canonical for modulus ${modulus}: ${parsed}`);
  }
  return parsed;
}

export function be32(value: Numberish, modulus = BN254_FP_MODULUS): Buffer {
  return Buffer.from(canonical(value, modulus).toString(16).padStart(64, "0"), "hex");
}

export function serializeG1(point: SnarkjsG1): Buffer {
  return Buffer.concat([be32(point[0]), be32(point[1])]);
}

export function serializeG2(point: SnarkjsG2): Buffer {
  const [x, y] = point;
  return Buffer.concat([be32(x[1]), be32(x[0]), be32(y[1]), be32(y[0])]);
}

export function serializeProof(proof: SnarkjsProof): Buffer {
  const bytes = Buffer.concat([serializeG1(proof.pi_a), serializeG2(proof.pi_b), serializeG1(proof.pi_c)]);
  if (bytes.length !== 256) throw new Error(`Expected 256 proof bytes, received ${bytes.length}`);
  return bytes;
}

export function serializeVerificationKey(vk: SnarkjsVerificationKey): Buffer {
  if (vk.IC.length === 0 || vk.IC.length > 0xffff_ffff) {
    throw new RangeError(`Invalid IC length: ${vk.IC.length}`);
  }
  const length = Buffer.alloc(4);
  length.writeUInt32BE(vk.IC.length);
  return Buffer.concat([
    serializeG1(vk.vk_alpha_1),
    serializeG2(vk.vk_beta_2),
    serializeG2(vk.vk_gamma_2),
    serializeG2(vk.vk_delta_2),
    length,
    ...vk.IC.map(serializeG1),
  ]);
}

export function serializePublicSignals(signals: readonly Numberish[]): Buffer[] {
  return signals.map((signal) => be32(signal, BN254_FR_MODULUS));
}
