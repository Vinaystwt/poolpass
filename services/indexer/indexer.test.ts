import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { nativeToScVal } from "@stellar/stellar-sdk";
import { describe, expect, test, vi } from "vitest";

import { normalizeEvent } from "./events.js";
import { PoolPassIndexer } from "./indexer.js";
import { EventStore } from "./store.js";

function rpcEvent(id = "0001-0000000000") {
  return {
    id,
    type: "contract",
    ledger: 100,
    ledgerClosedAt: "2026-06-23T00:00:00Z",
    contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
    txHash: "ab".repeat(32),
    topic: [nativeToScVal("root_updated", { type: "symbol" }).toXDR("base64"), nativeToScVal(1, { type: "u32" }).toXDR("base64")],
    value: nativeToScVal({ root: "ff".repeat(32), leaf_count: 8, timestamp: 1_750_000_000 }).toXDR("base64"),
    inSuccessfulContractCall: true,
  };
}

describe("PoolPass event indexer", () => {
  test("normalizes contract events into durable JSON", () => {
    expect(normalizeEvent(rpcEvent())).toMatchObject({
      id: "0001-0000000000",
      name: "root_updated",
      ledger: 100,
      epoch: 1,
      data: { leaf_count: "8", timestamp: "1750000000" },
    });
  });

  test("deduplicates events and resumes from the durable cursor", async () => {
    const directory = await mkdtemp(join(tmpdir(), "poolpass-indexer-"));
    const path = join(directory, "events.json");
    const fetchPage = vi.fn(async (startLedger: number) => ({ events: [rpcEvent()], latestLedger: startLedger + 5 }));
    const indexer = new PoolPassIndexer(new EventStore(path), fetchPage, 95);
    await indexer.runOnce();
    await indexer.runOnce();
    const state = JSON.parse(await readFile(path, "utf8"));
    expect(state.events).toHaveLength(1);
    expect(state.cursor).toBe(106);
    expect(fetchPage.mock.calls.map((call) => call[0])).toEqual([95, 101]);
  });
});
