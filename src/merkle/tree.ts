import { parseField } from "../crypto/field.js";
import { poseidon2, poseidon3 } from "../crypto/poseidon.js";

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

export async function buildTree(records: readonly InvestorRecord[]): Promise<MerkleTree> {
  if (records.length !== 8) throw new RangeError(`PoolPass demo tree requires exactly 8 records; received ${records.length}`);

  const normalized = records.map((record) => ({
    investorId: parseField(record.investorId),
    cap: parseField(record.cap),
    investorSecret: parseField(record.investorSecret),
  }));
  const investorIds = new Set(normalized.map((record) => record.investorId.toString()));
  if (investorIds.size !== normalized.length) throw new Error("Duplicate investor_id is not allowed");

  const leaves = await Promise.all(normalized.map((record) => poseidon3(record.investorId, record.cap, record.investorSecret)));
  if (new Set(leaves.map(String)).size !== leaves.length) throw new Error("Duplicate leaf hash is not allowed");

  return buildTreeFromLeaves(leaves);
}

export async function buildTreeFromLeaves(values: readonly (string | number | bigint)[]): Promise<MerkleTree> {
  if (values.length !== 8) throw new RangeError(`PoolPass demo tree requires exactly 8 leaves; received ${values.length}`);
  const leaves = values.map(parseField);
  const levels: bigint[][] = [leaves];
  while (levels.at(-1)!.length > 1) {
    const previous = levels.at(-1)!;
    const next: bigint[] = [];
    for (let index = 0; index < previous.length; index += 2) {
      next.push(await poseidon2(previous[index], previous[index + 1]));
    }
    levels.push(next);
  }
  return { depth: 3, leaves, levels, root: levels[3][0] };
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
  if (path.siblings.length !== 3 || path.indices.length !== 3) throw new RangeError("Merkle path must contain exactly 3 levels");
  let current = parseField(leaf);
  for (let level = 0; level < 3; level += 1) {
    const bit = path.indices[level];
    if (bit !== 0 && bit !== 1) throw new RangeError(`Merkle index must be a bit; received ${bit}`);
    const sibling = parseField(path.siblings[level]);
    current = bit === 0 ? await poseidon2(current, sibling) : await poseidon2(sibling, current);
  }
  return current;
}

export function treeToJson(tree: MerkleTree): object {
  return {
    depth: tree.depth,
    leaves: tree.leaves.map(String),
    levels: tree.levels.map((level) => level.map(String)),
    root: tree.root.toString(),
  };
}
