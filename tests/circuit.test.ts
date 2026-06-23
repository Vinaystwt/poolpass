import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { beforeAll, describe, expect, test } from "vitest";

import { poseidon2, poseidon3 } from "../src/crypto/poseidon.js";

const rootDir = resolve(import.meta.dirname, "..");
const circuit = join(rootDir, "circuits", "poolpass.circom");
const circom = join(rootDir, ".tools", "bin", "circom");
const outputDir = mkdtempSync(join(tmpdir(), "poolpass-circuit-"));

interface CircuitInput {
  merkle_root: string;
  amount: string;
  nullifier: string;
  epoch: string;
  investor_id: string;
  cap: string;
  investor_secret: string;
  merkle_path: string[];
  merkle_indices: string[];
}

let validInput: CircuitInput;

async function fixtureInput(): Promise<CircuitInput> {
  const records = Array.from({ length: 8 }, (_, index) => ({
    investorId: BigInt(index + 1),
    cap: BigInt(20_000_000_000 + index * 5_000_000_000),
    secret: BigInt(1_001 + index),
  }));
  const leaves = await Promise.all(records.map((row) => poseidon3(row.investorId, row.cap, row.secret)));
  const levels: bigint[][] = [leaves];
  while (levels.at(-1)!.length > 1) {
    const previous = levels.at(-1)!;
    const next: bigint[] = [];
    for (let index = 0; index < previous.length; index += 2) {
      next.push(await poseidon2(previous[index], previous[index + 1]));
    }
    levels.push(next);
  }

  const targetIndex = 2;
  const target = records[targetIndex];
  const path: bigint[] = [];
  const indices: bigint[] = [];
  let cursor = targetIndex;
  for (let level = 0; level < 3; level += 1) {
    path.push(levels[level][cursor ^ 1]);
    indices.push(BigInt(cursor & 1));
    cursor >>= 1;
  }
  const epoch = 1n;
  return {
    merkle_root: levels.at(-1)![0].toString(),
    amount: "25000000000",
    nullifier: (await poseidon2(target.secret, epoch)).toString(),
    epoch: epoch.toString(),
    investor_id: target.investorId.toString(),
    cap: target.cap.toString(),
    investor_secret: target.secret.toString(),
    merkle_path: path.map(String),
    merkle_indices: indices.map(String),
  };
}

function witness(input: CircuitInput): string[] {
  const inputPath = join(outputDir, `input-${crypto.randomUUID()}.json`);
  const witnessPath = join(outputDir, `witness-${crypto.randomUUID()}.wtns`);
  const witnessJson = `${witnessPath}.json`;
  writeFileSync(inputPath, JSON.stringify(input));
  execFileSync("node", [join(outputDir, "poolpass_js", "generate_witness.js"), join(outputDir, "poolpass_js", "poolpass.wasm"), inputPath, witnessPath]);
  execFileSync("pnpm", ["exec", "snarkjs", "wtns", "export", "json", witnessPath, witnessJson], { cwd: rootDir });
  return JSON.parse(readFileSync(witnessJson, "utf8")) as string[];
}

function expectRejected(input: CircuitInput): void {
  expect(() => witness(input)).toThrow();
}

beforeAll(async () => {
  validInput = await fixtureInput();
  execFileSync(circom, [circuit, "--r1cs", "--wasm", "--sym", "-o", outputDir], { cwd: rootDir });
}, 60_000);

describe("PoolPass circuit", () => {
  test("accepts a valid member and exposes the public signals in contract order", () => {
    const values = witness(validInput);
    expect(values.slice(1, 5)).toEqual([
      validInput.merkle_root,
      validInput.amount,
      validInput.nullifier,
      validInput.epoch,
    ]);
  });

  test("rejects amount above the private cap", () => {
    expectRejected({ ...validInput, amount: (BigInt(validInput.cap) + 1n).toString() });
  });

  test("rejects a wrong Merkle path", () => {
    expectRejected({ ...validInput, merkle_path: ["1", ...validInput.merkle_path.slice(1)] });
  });

  test("rejects a nullifier from another secret", async () => {
    expectRejected({ ...validInput, nullifier: (await poseidon2(9_999n, BigInt(validInput.epoch))).toString() });
  });

  test("rejects a non-boolean Merkle index", () => {
    expectRejected({ ...validInput, merkle_indices: ["2", ...validInput.merkle_indices.slice(1)] });
  });
});
