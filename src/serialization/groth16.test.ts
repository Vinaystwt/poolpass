import { describe, expect, test } from "vitest";
import { BN254_FP_MODULUS, be32, serializeG2, serializeProof } from "./groth16.js";

describe("Groth16 Soroban serialization", () => {
  test("serializes snarkjs G2 as x.c1|x.c0|y.c1|y.c0", () => {
    const bytes = serializeG2([
      ["1", "2"],
      ["3", "4"],
      ["1", "0"],
    ]);
    expect(bytes).toEqual(Buffer.concat([be32(2n), be32(1n), be32(4n), be32(3n)]));
  });

  test("serializes proof as A|B|C in 256 bytes", () => {
    const proof = {
      pi_a: ["1", "2", "1"],
      pi_b: [
        ["3", "4"],
        ["5", "6"],
        ["1", "0"],
      ],
      pi_c: ["7", "8", "1"],
      protocol: "groth16",
      curve: "bn128",
    } as const;
    const bytes = serializeProof(proof);
    expect(bytes).toHaveLength(256);
    expect(bytes).toEqual(
      Buffer.concat([be32(1n), be32(2n), be32(4n), be32(3n), be32(6n), be32(5n), be32(7n), be32(8n)]),
    );
  });

  test("rejects non-canonical coordinates", () => {
    expect(() => be32(BN254_FP_MODULUS)).toThrow(/canonical/i);
    expect(() => be32(-1n)).toThrow(/canonical/i);
  });
});
