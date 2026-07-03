import { describe, expect, test } from "vitest";

import {
  mergeOptimisticEvents,
  safeEventStartLedger,
} from "./events-live.js";
import type { EventsApiResponse, IndexedEvent } from "./indexer.js";

const optimistic: IndexedEvent = {
  id: "optimistic-abcd",
  name: "subscribed",
  poolId: "open-access",
  contractId: "contract",
  txHash: "abcd",
  ledger: Number.MAX_SAFE_INTEGER,
  closedAt: "2026-07-03T00:00:00Z",
  data: {
    amount: "25000000000",
    commitment: "11",
    nullifier: "22",
    timestamp: "1783036800",
  },
};

function response(events: IndexedEvent[]): EventsApiResponse {
  return {
    cursor: 20_000,
    events,
    source: "live",
    isStale: false,
    lastLedger: 20_000,
  };
}

describe("live event regression", () => {
  test("limits a stale cursor to the RPC-safe 10,000-ledger lookback", () => {
    expect(safeEventStartLedger(1, 20_000)).toBe(10_000);
  });

  test("keeps an optimistic subscription until its live event arrives", () => {
    const waiting = mergeOptimisticEvents(response([optimistic]), response([]));
    expect(waiting.events).toEqual([optimistic]);

    const live = {
      ...optimistic,
      id: "3409351-1",
      ledger: 34_093_51,
    };
    const reconciled = mergeOptimisticEvents(response([optimistic]), response([live]));
    expect(reconciled.events).toEqual([live]);
  });
});
