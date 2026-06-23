// Browser Merkle tree — mirrors src/merkle/tree.ts (depth-3, 8-leaf demo tree).
import { parseField } from "./field";
import { poseidon2, poseidon3 } from "./poseidon";

export interface InvestorRecord {
  investorId: string | number | bigint;
  cap: string | number | bigint;
  investorSecret: string | number | bigint;
}

export interface MerkleTree {
  depth: 3;
  leaves: bigint[];
  levels: bigint[][];
  root: bigint;
}

export interface MerklePath {
  index: number;
  siblings: bigint[];
  indices: number[];
}

export async function leafFromRecord(r: InvestorRecord): Promise<bigint> {
  return poseidon3(parseField(r.investorId), parseField(r.cap), parseField(r.investorSecret));
}

export async function buildTreeFromLeaves(values: readonly (string | number | bigint)[]): Promise<MerkleTree> {
  if (values.length !== 8) throw new RangeError(`Demo tree requires exactly 8 leaves; received ${values.length}`);
  const leaves = values.map(parseField);
  const levels: bigint[][] = [leaves];
  while (levels[levels.length - 1].length > 1) {
    const prev = levels[levels.length - 1];
    const next: bigint[] = [];
    for (let i = 0; i < prev.length; i += 2) next.push(await poseidon2(prev[i], prev[i + 1]));
    levels.push(next);
  }
  return { depth: 3, leaves, levels, root: levels[3][0] };
}

export async function buildTree(records: readonly InvestorRecord[]): Promise<MerkleTree> {
  if (records.length !== 8) throw new RangeError(`Demo tree requires exactly 8 records; received ${records.length}`);
  const leaves = await Promise.all(records.map(leafFromRecord));
  if (new Set(leaves.map(String)).size !== leaves.length) throw new Error("Duplicate leaf hash is not allowed");
  return buildTreeFromLeaves(leaves);
}

export function pathFor(tree: MerkleTree, index: number): MerklePath {
  if (!Number.isInteger(index) || index < 0 || index >= tree.leaves.length) {
    throw new RangeError(`Leaf index out of range: ${index}`);
  }
  const siblings: bigint[] = [];
  const indices: number[] = [];
  let cursor = index;
  for (let level = 0; level < tree.depth; level += 1) {
    siblings.push(tree.levels[level][cursor ^ 1]);
    indices.push(cursor & 1);
    cursor >>= 1;
  }
  return { index, siblings, indices };
}

export async function verifyPath(leaf: bigint, path: MerklePath): Promise<bigint> {
  let current = parseField(leaf);
  for (let level = 0; level < 3; level += 1) {
    const bit = path.indices[level];
    const sib = parseField(path.siblings[level]);
    current = bit === 0 ? await poseidon2(current, sib) : await poseidon2(sib, current);
  }
  return current;
}
