import { describe, expect, test } from "vitest";
import { BN254_FR_MODULUS, fieldToBytes, parseField } from "./field.js";
import { poseidon2, poseidon3 } from "./poseidon.js";

describe("BN254 Poseidon parity", () => {
  test("matches the canonical circomlib Poseidon([1,2]) vector", async () => {
    expect(await poseidon2(1n, 2n)).toBe(
      7853200120776062878684798364095072458815029376092732009249414926327459813530n,
    );
  });

  test("uses distinct arity-three parameters for leaves", async () => {
    const hash = await poseidon3(1n, 2n, 3n);
    expect(hash).toBe(6542985608222806190361240322586112750744169038454362455181422643027100751666n);
  });

  test("rejects non-canonical field inputs", async () => {
    await expect(poseidon2(BN254_FR_MODULUS, 0n)).rejects.toThrow(/canonical/i);
    expect(() => parseField("-1")).toThrow(/canonical/i);
  });

  test("serializes canonical fields as 32-byte big-endian", () => {
    expect(fieldToBytes(0x0102n).toString("hex")).toBe(`${"00".repeat(30)}0102`);
  });
});
