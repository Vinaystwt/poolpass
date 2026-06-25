import { describe, expect, test } from "vitest";

import {
  buildPoolEventFilters,
  clampEventStartLedger,
  liveEventsResponse,
  staleEventsResponse,
} from "./events-live";
import type { IndexerState } from "./indexer";

const pools = [
  { id: "open-access", contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM" },
  { id: "capped-allocation", contractId: "CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBD2KM" },
];

describe("live event response helpers", () => {
  test("clamps event scans to RPC retention", () => {
    expect(clampEventStartLedger(100, 20_000)).toBe(3_000);
    expect(clampEventStartLedger(19_995, 20_000)).toBe(19_996);
  });

  test("builds filters across every pool contract", () => {
    const filters = buildPoolEventFilters(pools, {
      subscribed: "subscribed",
      rootUpdated: "root_updated",
      epochAdvanced: "epoch_advanced",
    });
    expect(filters).toHaveLength(3);
    for (const filter of filters) {
      expect(filter.contractIds).toEqual(pools.map((pool) => pool.contractId));
    }
  });

  test("marks snapshot fallback as stale instead of live", () => {
    const base: IndexerState = { cursor: 123, events: [] };
    expect(staleEventsResponse(base, new Error("retention"))).toMatchObject({
      source: "snapshot",
      isStale: true,
      lastLedger: 123,
      events: [],
      note: "Error: retention",
    });
    expect(liveEventsResponse(base)).toMatchObject({
      source: "live",
      isStale: false,
      lastLedger: 123,
    });
  });
});
