"use client";

import { useQuery } from "@tanstack/react-query";
import { getPoolInfo, getMockUsdcBalance, type PoolInfo } from "../stellar/client";
import { fetchEvents } from "../api";
import type { IndexerState } from "../indexer";

export function usePoolInfo() {
  return useQuery<PoolInfo>({
    queryKey: ["pool-info"],
    queryFn: getPoolInfo,
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
  return useQuery<IndexerState & { source?: string }>({
    queryKey: ["indexer"],
    queryFn: fetchEvents,
    refetchInterval: 8_000,
  });
}
