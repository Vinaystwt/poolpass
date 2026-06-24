"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useIndexer } from "@/lib/hooks/use-pool";
import { subscriptions } from "@/lib/indexer";
import { HashChip } from "@/components/shared/copy";
import { formatMockUsdc, stellarExpertTx, truncate } from "@/lib/utils";
import { MOCK_USDC } from "@/lib/backend-config";

export function MySubscriptions() {
  const { data } = useIndexer();
  const subs = data ? subscriptions(data) : [];

  if (subs.length === 0) return null;

  return (
    <section>
      <h2 className="text-display-md text-ink">Recent subscriptions</h2>
      <p className="mt-xxs text-body-md text-ink-mute">
        Live from the indexer. Every row is a real testnet subscription — verify any of them.
      </p>
      <div className="mt-lg overflow-x-auto rounded-lg border border-hairline">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-hairline text-micro-cap uppercase tracking-wide text-ink-mute">
              <th className="px-md py-sm font-normal">Amount</th>
              <th className="px-md py-sm font-normal">Commitment</th>
              <th className="px-md py-sm font-normal">Nullifier</th>
              <th className="px-md py-sm font-normal">When</th>
              <th className="px-md py-sm font-normal">Tx</th>
              <th className="px-md py-sm font-normal" />
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.txHash} className="border-b border-hairline/60 last:border-0">
                <td className="px-md py-sm tnum text-body-md text-ink">
                  {formatMockUsdc(s.amount)} {MOCK_USDC.ticker}
                </td>
                <td className="px-md py-sm"><HashChip value={s.commitment} copy={false} /></td>
                <td className="px-md py-sm"><HashChip value={s.nullifier} copy={false} /></td>
                <td className="px-md py-sm text-caption text-ink-mute">{new Date(s.closedAt).toLocaleString()}</td>
                <td className="px-md py-sm">
                  <a
                    href={stellarExpertTx(s.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-xxs text-caption text-primary"
                  >
                    {truncate(s.txHash, 4, 4)} <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-md py-sm">
                  <Link href={`/verify/${s.txHash}`} className="text-caption text-accent-proof hover:underline">
                    Verify
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
