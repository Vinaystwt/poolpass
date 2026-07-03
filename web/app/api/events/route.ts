import { NextResponse } from "next/server";
import { rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import snapshot from "@/lib/events-snapshot.json";
import { CONTRACTS, NETWORK, EVENT_NAMES, POOLS } from "@/lib/backend-config";
import {
  buildPoolEventFilters,
  liveEventsResponse,
  safeEventStartLedger,
  staleEventsResponse,
} from "@/lib/events-live";
import type { IndexedEvent, IndexerState } from "@/lib/indexer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Uint8Array) return Buffer.from(value).toString("hex");
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, jsonSafe(v)]));
  }
  return value;
}

// Mirrors services/indexer/events.ts normalizeEvent.
function normalize(e: rpc.Api.EventResponse): IndexedEvent {
  const topics = (e.topic as xdr.ScVal[]).map((t) => scValToNative(t));
  const contractId = e.contractId?.toString() ?? CONTRACTS.poolpass;
  const poolId = POOLS.find((pool) => pool.contractId === contractId)?.id;
  return {
    id: e.id,
    name: String(topics[0]) as IndexedEvent["name"],
    ...(poolId ? { poolId } : {}),
    contractId,
    txHash: e.txHash,
    ledger: e.ledger,
    closedAt: e.ledgerClosedAt,
    epoch: typeof topics[1] === "number" ? topics[1] : undefined,
    data: jsonSafe(scValToNative(e.value)) as IndexedEvent["data"],
  };
}

async function liveMerge(base: IndexerState): Promise<IndexerState> {
  const server = new rpc.Server(NETWORK.rpcUrl);
  const latest = await server.getLatestLedger();
  const startLedger = safeEventStartLedger(base.cursor, latest.sequence);
  if (startLedger >= latest.sequence) return base;

  const res = await server.getEvents({
    startLedger,
    filters: buildPoolEventFilters(POOLS, EVENT_NAMES),
  });

  const byId = new Map(base.events.map((e) => [e.id, e]));
  for (const e of res.events) {
    if (e.inSuccessfulContractCall === false) continue;
    try {
      const n = normalize(e);
      byId.set(n.id, n);
    } catch {
      /* skip undecodable */
    }
  }
  const events = Array.from(byId.values()).sort((a, b) => a.ledger - b.ledger || a.id.localeCompare(b.id));
  return { cursor: res.latestLedger ?? base.cursor, events };
}

export async function GET() {
  const base = snapshot as IndexerState;
  try {
    const merged = await liveMerge(base);
    return NextResponse.json(liveEventsResponse(merged));
  } catch (err) {
    return NextResponse.json(staleEventsResponse(base, err));
  }
}
