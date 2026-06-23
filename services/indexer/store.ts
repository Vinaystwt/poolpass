import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { IndexedEvent } from "./events.js";

export interface IndexerState {
  cursor?: number;
  events: IndexedEvent[];
}

export class EventStore {
  constructor(private readonly path: string) {}

  async load(): Promise<IndexerState> {
    try {
      return JSON.parse(await readFile(this.path, "utf8")) as IndexerState;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { events: [] };
      throw error;
    }
  }

  async merge(events: IndexedEvent[], cursor: number): Promise<IndexerState> {
    const state = await this.load();
    const byId = new Map(state.events.map((event) => [event.id, event]));
    for (const event of events) byId.set(event.id, event);
    const next = { cursor, events: [...byId.values()].sort((left, right) => left.ledger - right.ledger || left.id.localeCompare(right.id)) };
    const temporary = `${this.path}.${randomUUID()}.tmp`;
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, this.path);
    return next;
  }
}
