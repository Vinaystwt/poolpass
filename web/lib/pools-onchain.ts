"use client";

// Resilient marketplace display: read the three pools straight from chain via
// get_pool_info (no keys, simulate-only), with subscriber stats from the indexer
// snapshot. Used as a fallback when the keyed backend /pools is unreachable, so the
// public site still shows a real, on-chain marketplace.
import { POOLS } from "./backend-config";
import { getPoolInfo } from "./stellar/client";
import type { PoolMarket } from "./api";

interface RawEvent {
  name: string;
  poolId?: string;
  data?: { amount?: string };
}

export async function readPoolsOnChain(): Promise<PoolMarket[]> {
  const events: RawEvent[] = await fetch("/api/events", { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => d.events ?? [])
    .catch(() => []);

  return Promise.all(
    POOLS.map(async (p) => {
      const info = await getPoolInfo(p.contractId);
      const subs = events.filter((e) => e.name === "subscribed" && e.poolId === p.id);
      const volume = subs.reduce((sum, e) => sum + BigInt(e.data?.amount ?? "0"), 0n);
      return {
        id: p.id,
        name: info.pool_name,
        gateDescription: p.gateDescription,
        contractId: p.contractId,
        poolToken: p.poolToken,
        issuer: p.issuer,
        vk: p.vk,
        merkleDepth: info.merkle_depth,
        leafCount: 2 ** info.merkle_depth,
        perInvestorCapPublic:
          info.per_investor_cap_public != null
            ? info.per_investor_cap_public.toString()
            : p.perInvestorCapPublic || "0",
        totalSubscribed: info.total_subscribed.toString(),
        epoch: info.epoch,
        currentRoot: info.merkle_root,
        subscriberCount: subs.length,
        subscribedVolume: volume.toString(),
      } satisfies PoolMarket;
    }),
  );
}
