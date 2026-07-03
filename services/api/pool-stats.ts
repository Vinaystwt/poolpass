export interface PoolStatEvent {
  name: string;
  poolId?: string;
  contractId: string;
  txHash: string;
  data?: { amount?: string };
}

export function mergeLiveSubscriptions(
  snapshot: PoolStatEvent[],
  live: PoolStatEvent[],
): PoolStatEvent[] {
  const merged = new Map(
    snapshot.map((event) => [`${event.contractId}:${event.txHash}:${event.name}`, event]),
  );
  for (const event of live) {
    merged.set(`${event.contractId}:${event.txHash}:${event.name}`, event);
  }
  return Array.from(merged.values());
}
