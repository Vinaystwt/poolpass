// Browser Groth16 serializer, mirrors src/serialization/groth16.ts byte layout:
//   G1: x[32] || y[32]
//   G2: x.c1[32] || x.c0[32] || y.c1[32] || y.c0[32]   (snarkjs emits [c0,c1]; we reverse)
//   Proof: A G1 || B G2 || C G1  (exactly 256 bytes)
//   VK: alpha G1 || beta G2 || gamma G2 || delta G2 || ic_len u32 BE || IC[]
import { FP_MODULUS, FR_MODULUS, bytesToHex, hexToBytes } from "./field";

type Numberish = string | bigint | number;
export type SnarkjsG1 = readonly Numberish[];
export type SnarkjsG2 = readonly (readonly Numberish[])[];

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

function be32(value: Numberish, modulus: bigint = FP_MODULUS): Uint8Array {
  const v = BigInt(value);
  if (v < 0n || v >= modulus) throw new RangeError(`Value not canonical for modulus: ${v}`);
  return hexToBytes(v.toString(16).padStart(64, "0"));
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

function g1(point: SnarkjsG1): Uint8Array {
  return concat([be32(point[0]), be32(point[1])]);
}
function g2(point: SnarkjsG2): Uint8Array {
  const [x, y] = point;
  return concat([be32(x[1]), be32(x[0]), be32(y[1]), be32(y[0])]);
}

export function serializeProof(proof: SnarkjsProof): Uint8Array {
  const bytes = concat([g1(proof.pi_a), g2(proof.pi_b), g1(proof.pi_c)]);
  if (bytes.length !== 256) throw new Error(`Expected 256 proof bytes, received ${bytes.length}`);
  return bytes;
}

export function serializeProofHex(proof: SnarkjsProof): string {
  return bytesToHex(serializeProof(proof));
}

export function serializePublicSignals(signals: readonly Numberish[]): Uint8Array[] {
  return signals.map((s) => be32(s, FR_MODULUS));
}

export function serializePublicSignalsHex(signals: readonly Numberish[]): string[] {
  return serializePublicSignals(signals).map(bytesToHex);
}

// ── Deserialize 256-byte proof back into a snarkjs proof object ───────────────
// Used by the verify page when reconstructing a proof from on-chain tx args.
function fieldAt(bytes: Uint8Array, i: number): string {
  return BigInt(`0x${bytesToHex(bytes.slice(i * 32, i * 32 + 32))}`).toString();
}

export interface MutableSnarkProof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export function deserializeProof(bytes: Uint8Array): MutableSnarkProof {
  if (bytes.length !== 256) throw new Error(`Expected 256 proof bytes, received ${bytes.length}`);
  // A: words 0,1 ; B: 2..5 (c1,c0 per coord) ; C: 6,7
  return {
    protocol: "groth16",
    curve: "bn128",
    pi_a: [fieldAt(bytes, 0), fieldAt(bytes, 1), "1"],
    pi_b: [
      [fieldAt(bytes, 3), fieldAt(bytes, 2)], // stored as c1,c0 -> snarkjs [c0,c1]
      [fieldAt(bytes, 5), fieldAt(bytes, 4)],
      ["1", "0"],
    ],
    pi_c: [fieldAt(bytes, 6), fieldAt(bytes, 7), "1"],
  };
}
