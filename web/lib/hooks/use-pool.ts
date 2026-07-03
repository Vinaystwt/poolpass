"use client";

import { useQuery } from "@tanstack/react-query";
import { getPoolInfo, getMockUsdcBalance, type PoolInfo } from "../stellar/client";
import { fetchEvents, fetchPools, type PoolMarket } from "../api";
import type { IndexerState } from "../indexer";
import { mergeOptimisticEvents } from "../events-live";

export function usePools() {
  return useQuery<PoolMarket[]>({
    queryKey: ["pools"],
    queryFn: fetchPools,
    refetchInterval: 20_000,
  });
}

export function usePoolInfo() {
  return useQuery<PoolInfo>({
    queryKey: ["pool-info"],
    queryFn: () => getPoolInfo(),
    refetchInterval: 20_000,
  });
}

export function useMockUsdcBalance(address: string | null) {
  return useQuery<bigint>({
    queryKey: ["musdc-balance", address],
    queryFn: () => getMockUsdcBalance(address!),
    enabled: Boolean(address),
    refetchInterval: 15_000,
  });
}

export function useIndexer() {
  type IndexerQueryData = IndexerState & { source?: string };
  return useQuery<IndexerQueryData>({
    queryKey: ["indexer"],
    queryFn: fetchEvents,
    refetchInterval: 8_000,
    structuralSharing: (previous, current) =>
      mergeOptimisticEvents(
        previous as IndexerQueryData | undefined,
        current as IndexerQueryData,
      ),
  });
}
