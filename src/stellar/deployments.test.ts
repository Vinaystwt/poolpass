import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import {
  assertPublicRegistry,
  contractIsLive,
  shouldReuseContract,
  writeRegistryAtomic,
  type ContractDeployment,
} from "./deployments.js";

describe("deployment registry", () => {
  test("reuses only a live deployment with the expected code hash", async () => {
    const entry: ContractDeployment = { contractId: `C${"A".repeat(55)}`, wasmHash: "ab".repeat(32) };
    expect(shouldReuseContract(entry, "ab".repeat(32), true)).toBe(true);
    expect(shouldReuseContract(entry, "cd".repeat(32), true)).toBe(false);
    expect(shouldReuseContract(entry, "ab".repeat(32), false)).toBe(false);
  });

  test("checks liveness through Stellar CLI without sending a transaction", async () => {
    const calls: string[][] = [];
    const live = await contractIsLive(async (args) => {
      calls.push(args);
      return { stdout: "contract interface", stderr: "" };
    }, `C${"A".repeat(55)}`);
    expect(live).toBe(true);
    expect(calls[0]).toContain("interface");
    expect(calls[0]).toContain("testnet");
  });

  test("writes complete JSON atomically", async () => {
    const directory = await mkdtemp(join(tmpdir(), "poolpass-deployments-"));
    const path = join(directory, "deployments.json");
    const value = { contracts: { poolpass: { contractId: `C${"A".repeat(55)}`, wasmHash: "00".repeat(32) } } };
    await writeRegistryAtomic(path, value);
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual(value);
  });

  test("rejects secret keys at any nesting depth", () => {
    expect(() => assertPublicRegistry({ nested: { private: `S${"A".repeat(55)}` } })).toThrow(/secret/i);
  });
});
