import { nativeToScVal } from "@stellar/stellar-sdk";

import type { IndexerState } from "./indexer";

export const RPC_RETENTION_LEDGERS = 17_000;

export interface EventPool {
  id: string;
  contractId: string;
}

export interface EventNames {
  subscribed: string;
  rootUpdated: string;
  epochAdvanced: string;
}

export interface EventFilter {
  type: "contract";
  contractIds: string[];
  topics: string[][];
}

export type EventSource = "live" | "snapshot";

export type EventsResponse = IndexerState & {
  source: EventSource;
  isStale: boolean;
  lastLedger: number | null;
  note?: string;
};

export function clampEventStartLedger(cursor: number | undefined, latestLedger: number): number {
  return Math.max((cursor ?? 0) + 1, latestLedger - RPC_RETENTION_LEDGERS);
}

function topicFor(name: string): string[] {
  return [nativeToScVal(name, { type: "symbol" }).toXDR("base64"), "*", "*"];
}

export function buildPoolEventFilters(pools: EventPool[], names: EventNames): EventFilter[] {
  const contractIds = pools.map((pool) => pool.contractId);
  return [
    { type: "contract", contractIds, topics: [topicFor(names.subscribed)] },
    { type: "contract", contractIds, topics: [topicFor(names.rootUpdated).slice(0, 2)] },
    { type: "contract", contractIds, topics: [topicFor(names.epochAdvanced).slice(0, 2)] },
  ];
}

export function liveEventsResponse(state: IndexerState): EventsResponse {
  return { ...state, source: "live", isStale: false, lastLedger: state.cursor ?? null };
}

export function staleEventsResponse(base: IndexerState, error: unknown): EventsResponse {
  return {
    ...base,
    source: "snapshot",
    isStale: true,
    lastLedger: base.cursor ?? null,
    note: String(error),
  };
}
