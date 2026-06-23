import { describe, expect, test } from "vitest";

import { BN254_FR_MODULUS } from "../crypto/field.js";
import { buildTree, buildTreeFromLeaves, pathFor, verifyPath, type InvestorRecord } from "./tree.js";

const records: InvestorRecord[] = Array.from({ length: 8 }, (_, index) => ({
  investorId: BigInt(index + 1),
  cap: BigInt(20_000_000_000 + index * 5_000_000_000),
  investorSecret: BigInt(1_001 + index),
}));

describe("PoolPass Merkle tree", () => {
  test("builds eight leaves and verifies every generated path", async () => {
    const tree = await buildTree(records);
    expect(tree.levels.map((level) => level.length)).toEqual([8, 4, 2, 1]);
    for (let index = 0; index < 8; index += 1) {
      expect(await verifyPath(tree.leaves[index], pathFor(tree, index))).toBe(tree.root);
    }
  });

  test("uses 0 for a current-left node and 1 for a current-right node", async () => {
    const tree = await buildTree(records);
    expect(pathFor(tree, 2).indices).toEqual([0, 1, 0]);
    expect(pathFor(tree, 3).indices).toEqual([1, 1, 0]);
  });

  test("requires exactly eight unique investors", async () => {
    await expect(buildTree(records.slice(0, 7))).rejects.toThrow(/exactly 8/);
    await expect(buildTree([...records.slice(0, 7), records[0]])).rejects.toThrow(/duplicate/i);
  });

  test("rejects non-canonical field values", async () => {
    await expect(buildTree([{ ...records[0], investorSecret: BN254_FR_MODULUS }, ...records.slice(1)])).rejects.toThrow(/canonical/i);
  });

  test("rejects invalid path indices", async () => {
    const tree = await buildTree(records);
    await expect(verifyPath(tree.leaves[0], { ...pathFor(tree, 0), indices: [2, 0, 0] })).rejects.toThrow(/bit/);
  });

  test("builds a padded leaf-only tree for self-serve accreditation", async () => {
    const tree = await buildTree(records);
    const padded = await buildTreeFromLeaves([tree.leaves[0], 0n, 0n, 0n, 0n, 0n, 0n, 0n]);
    expect(await verifyPath(tree.leaves[0], pathFor(padded, 0))).toBe(padded.root);
  });
});
