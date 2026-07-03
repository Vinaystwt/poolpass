"use client";

import { formatMockUsdc } from "@/lib/utils";
import { MOCK_USDC } from "@/lib/backend-config";
import type { PoolMarket } from "@/lib/api";

/** Honest side-by-side of the three real pools so the choice is real. */
export function PoolCompare({ pools, onInspect }: { pools: PoolMarket[]; onInspect: (id: string) => void }) {
  const rows: { label: string; get: (p: PoolMarket) => string }[] = [
    { label: "Per-investor cap", get: (p) => `${formatMockUsdc(p.perInvestorCapPublic)} ${MOCK_USDC.ticker}` },
    { label: "Gate depth", get: (p) => `${p.merkleDepth} · ${p.leafCount} leaves` },
    { label: "On-chain total", get: (p) => `${formatMockUsdc(p.totalSubscribed)} ${MOCK_USDC.ticker}` },
    { label: "Indexed subscribers", get: (p) => String(p.subscriberCount) },
    { label: "Indexed volume", get: (p) => `${formatMockUsdc(p.subscribedVolume)} ${MOCK_USDC.ticker}` },
    { label: "Epoch", get: (p) => String(p.epoch) },
  ];
  return (
    <div className="overflow-x-auto rounded-lg border border-hairline bg-card">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-hairline">
            <th className="px-md py-sm text-micro-cap uppercase tracking-wide text-ink-mute">Compare</th>
            {pools.map((p) => (
              <th key={p.id} className="px-md py-sm">
                <button onClick={() => onInspect(p.id)} className="text-body-md font-medium text-ink underline decoration-dotted underline-offset-4 hover:text-ink-secondary">
                  {p.name}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-hairline/60 last:border-0">
              <td className="px-md py-sm text-caption text-ink-mute">{r.label}</td>
              {pools.map((p) => (
                <td key={p.id} className="px-md py-sm tnum text-body-md text-ink">
                  {r.get(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
