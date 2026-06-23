export const BN254_FR_MODULUS =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export function assertCanonicalField(value: bigint): bigint {
  if (value < 0n || value >= BN254_FR_MODULUS) {
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
  return assertCanonicalField(parsed);
}

export function fieldToBytes(value: bigint): Buffer {
  const hex = assertCanonicalField(value).toString(16).padStart(64, "0");
  return Buffer.from(hex, "hex");
}

export function bytesToField(bytes: Uint8Array): bigint {
  if (bytes.length !== 32) throw new RangeError(`Expected 32 field bytes, received ${bytes.length}`);
  return assertCanonicalField(BigInt(`0x${Buffer.from(bytes).toString("hex")}`));
}

