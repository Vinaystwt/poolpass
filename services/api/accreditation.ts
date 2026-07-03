import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { buildTreeFromLeaves, pathFor } from "../../src/merkle/tree.js";

export interface AccreditationChain {
  update(
    leaves: string[],
    computedRoot: string,
  ): Promise<{ root: string; epoch: number; hash?: string }>;
}

interface AccreditationState {
  leaves: string[];
}

export class AccreditationService {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly path: string,
    private readonly chain: AccreditationChain,
  ) {}

  add(leaf: string): Promise<object> {
    const work = this.queue.then(() => this.addSerialized(leaf));
    this.queue = work.catch(() => undefined);
    return work;
  }

  private async state(): Promise<AccreditationState> {
    try {
      return JSON.parse(await readFile(this.path, "utf8")) as AccreditationState;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { leaves: [] };
      throw error;
    }
  }

  private async save(state: AccreditationState): Promise<void> {
    const temporary = `${this.path}.${randomUUID()}.tmp`;
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, this.path);
  }

  private async addSerialized(leaf: string): Promise<object> {
    const state = await this.state();
    if (state.leaves.includes(leaf)) throw new Error("Leaf is already accredited");
    if (state.leaves.length >= 8) throw new Error("Demo accredited set is full");
    const next = [...state.leaves, leaf];
    const padded = [...next, ...Array<string>(8 - next.length).fill("0".repeat(64))];
    const tree = await buildTreeFromLeaves(padded.map((value) => BigInt(`0x${value}`)));
    const root = tree.root.toString();
    const committed = await this.chain.update(padded, root);
    const committedRoot = /^[0-9a-f]{64}$/i.test(committed.root) ? BigInt(`0x${committed.root}`) : BigInt(committed.root);
    if (committedRoot !== tree.root) throw new Error("Chain committed a different Merkle root");
    await this.save({ leaves: next });
    const index = next.length - 1;
    const path = pathFor(tree, index);
    return {
      leaf,
      root,
      epoch: committed.epoch,
      ...(committed.hash ? { txHash: committed.hash } : {}),
      index,
      merkle_path: path.siblings.map(String),
      merkle_indices: path.indices,
    };
  }
}
