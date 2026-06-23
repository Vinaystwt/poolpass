import { normalizeEvent, type RpcContractEvent } from "./events.js";
import { EventStore } from "./store.js";

export type EventPageFetcher = (startLedger: number) => Promise<{ events: RpcContractEvent[]; latestLedger: number }>;

export class PoolPassIndexer {
  constructor(
    private readonly store: EventStore,
    private readonly fetchPage: EventPageFetcher,
    private readonly startLedger: number,
  ) {}

  async runOnce(): Promise<{ cursor: number; events: number }> {
    const state = await this.store.load();
    const start = state.cursor === undefined ? this.startLedger : state.cursor + 1;
    const page = await this.fetchPage(start);
    const successful = page.events.filter((event) => event.inSuccessfulContractCall).map(normalizeEvent);
    const persisted = await this.store.merge(successful, page.latestLedger);
    return { cursor: page.latestLedger, events: persisted.events.length };
  }
}
