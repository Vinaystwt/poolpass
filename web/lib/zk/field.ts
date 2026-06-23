import { FIELD } from "../backend-config";

export const FR_MODULUS = FIELD.FR_MODULUS;
export const FP_MODULUS = FIELD.FP_MODULUS;

export function assertCanonicalFr(value: bigint): bigint {
  if (value < 0n || value >= FR_MODULUS) {
    throw new RangeError(`Field value must be canonical BN254 Fr: ${value}`);
  }
  return value;
}

export function parseField(value: string | bigint | number): bigint {
  let parsed: bigint;
  try {
    parsed = typeof value === "bigint" ? value : BigInt(value);
  } catch {
    throw new TypeError(`Invalid field value: ${String(value)}`);
  }
  return assertCanonicalFr(parsed);
}

/** 32-byte big-endian lowercase hex (no 0x), canonical for the given modulus. */
export function toHex32(value: string | bigint | number, modulus: bigint = FP_MODULUS): string {
  const v = BigInt(value);
  if (v < 0n || v >= modulus) throw new RangeError(`Value not canonical for modulus: ${v}`);
  return v.toString(16).padStart(64, "0");
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error("hex must have even length");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToField(hex: string): bigint {
  return assertCanonicalFr(BigInt(`0x${hex.startsWith("0x") ? hex.slice(2) : hex}`));
}

/** Cryptographically random canonical Fr value (browser WebCrypto). */
export function randomFr(): bigint {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  // Reduce modulo Fr to stay canonical.
  return BigInt(`0x${bytesToHex(bytes)}`) % FR_MODULUS;
}
