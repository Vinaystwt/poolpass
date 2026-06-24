import { NextResponse } from "next/server";
import { rpc, scValToNative, xdr, nativeToScVal } from "@stellar/stellar-sdk";
import snapshot from "@/lib/events-snapshot.json";
import { CONTRACTS, NETWORK, EVENT_NAMES } from "@/lib/backend-config";
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
  return {
    id: e.id,
    name: String(topics[0]) as IndexedEvent["name"],
    contractId: e.contractId?.toString() ?? CONTRACTS.poolpass,
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
  // Stay within RPC retention: start just after the snapshot cursor, clamped.
  const startLedger = Math.max((base.cursor ?? 0) + 1, latest.sequence - 17000);
  if (startLedger >= latest.sequence) return base;

  const topicFor = (name: string) => [nativeToScVal(name, { type: "symbol" }).toXDR("base64"), "*", "*"];
  const res = await server.getEvents({
    startLedger,
    filters: [
      { type: "contract", contractIds: [CONTRACTS.poolpass], topics: [topicFor(EVENT_NAMES.subscribed)] },
      { type: "contract", contractIds: [CONTRACTS.poolpass], topics: [topicFor(EVENT_NAMES.rootUpdated).slice(0, 2)] },
      { type: "contract", contractIds: [CONTRACTS.poolpass], topics: [topicFor(EVENT_NAMES.epochAdvanced).slice(0, 2)] },
    ],
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
    return NextResponse.json({ ...merged, source: "live" });
  } catch (err) {
    // RPC outside retention window or unreachable, serve the committed snapshot.
    return NextResponse.json({ ...base, source: "snapshot", note: String(err) });
  }
}
