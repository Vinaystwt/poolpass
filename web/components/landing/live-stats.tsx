"use client";

import { useIndexer, usePools } from "@/lib/hooks/use-pool";
import { subscriptions, rootUpdates } from "@/lib/indexer";
import { formatMockUsdc } from "@/lib/utils";
import { MOCK_USDC } from "@/lib/backend-config";

export function LiveStats() {
  const { data } = useIndexer();
  const { data: pools } = usePools();
  if (!data) return null;

  const subs = subscriptions(data);
  const roots = rootUpdates(data);
  if (subs.length === 0 && roots.length === 0) return null; // hide rather than fake

  const totalVolume = subs.reduce((acc, s) => acc + BigInt(s.amount), 0n);
  const stats = [
    { value: String(subs.length), label: "Private subscriptions" },
    { value: `${formatMockUsdc(totalVolume)}`, label: `${MOCK_USDC.labelShort} subscribed` },
    { value: String(roots.length), label: "Roots committed" },
    { value: String(pools?.length ?? 0), label: "Active pools" },
  ];

  return (
    <section className="border-y border-hairline bg-canvas-soft">
      <div className="mx-auto max-w-container px-lg py-xxl">
        <p className="text-micro-cap uppercase tracking-wide text-ink-mute">Live from the indexer · testnet</p>
        <div className="mt-lg grid grid-cols-2 gap-lg md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="tnum text-display-lg font-light text-ink">{s.value}</p>
              <p className="text-caption text-ink-mute">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
