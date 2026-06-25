// Frontend view of the PoolPass indexer state (services/data/events.json shape).
// Topics that the indexer drops for `subscribed` (investor, epoch) are not present
// here; the verify page reconstructs missing context from in-session proof packages
// or from the on-chain transaction when needed.

export interface SubscribedData {
  amount: string;
  commitment: string;
  nullifier: string;
  timestamp: string;
}
export interface RootUpdatedData {
  leaf_count: number;
  root: string;
  timestamp: string;
}

export interface IndexedEvent {
  id: string;
  name: "subscribed" | "root_updated" | "epoch_advanced";
  poolId?: string;
  contractId: string;
  txHash: string;
  ledger: number;
  closedAt: string;
  epoch?: number;
  data: SubscribedData | RootUpdatedData | { timestamp: string };
}

export interface IndexerState {
  cursor?: number;
  events: IndexedEvent[];
}

export interface EventsApiResponse extends IndexerState {
  source: "live" | "snapshot";
  isStale: boolean;
  lastLedger: number | null;
  note?: string;
}

export interface SubscriptionRecord {
  txHash: string;
  ledger: number;
  closedAt: string;
  amount: string;
  commitment: string;
  nullifier: string;
  timestamp: string;
}

export function subscriptions(state: IndexerState): SubscriptionRecord[] {
  return state.events
    .filter((e): e is IndexedEvent & { data: SubscribedData } => e.name === "subscribed")
    .map((e) => ({
      txHash: e.txHash,
      ledger: e.ledger,
      closedAt: e.closedAt,
      amount: e.data.amount,
      commitment: e.data.commitment,
      nullifier: e.data.nullifier,
      timestamp: e.data.timestamp,
    }))
    .sort((a, b) => b.ledger - a.ledger);
}

export function rootUpdates(state: IndexerState) {
  return state.events
    .filter((e): e is IndexedEvent & { data: RootUpdatedData } => e.name === "root_updated")
    .map((e) => ({
      txHash: e.txHash,
      ledger: e.ledger,
      closedAt: e.closedAt,
      epoch: e.epoch,
      root: e.data.root,
      leafCount: e.data.leaf_count,
    }))
    .sort((a, b) => b.ledger - a.ledger);
}

/** Resolve a route param (tx hash OR commitment hash) to a subscription. */
export function findSubscription(state: IndexerState, key: string): SubscriptionRecord | null {
  const norm = key.toLowerCase().replace(/^0x/, "");
  return (
    subscriptions(state).find((s) => s.txHash.toLowerCase() === norm || s.commitment.toLowerCase() === norm) ?? null
  );
}
