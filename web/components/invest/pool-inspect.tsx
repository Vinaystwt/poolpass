"use client";

import { X, Lock, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HashChip } from "@/components/shared/copy";
import { MySubscriptions } from "@/components/invest/my-subscriptions";
import { Term } from "@/components/shared/term";
import { formatMockUsdc, truncate } from "@/lib/utils";
import { MOCK_USDC } from "@/lib/backend-config";
import type { PoolMarket } from "@/lib/api";

/**
 * Examine a pool before committing. The gate is shown honestly: the root is public,
 * the individual accredited leaves are the issuer's private list. Live subscriber
 * stream is filtered to this pool.
 */
export function PoolInspect({
  pool,
  onSubscribe,
  onClose,
}: {
  pool: PoolMarket;
  onSubscribe: () => void;
  onClose: () => void;
}) {
  return (
    <Card className="p-xl">
      <div className="flex items-start justify-between gap-md">
        <div>
          <div className="flex items-center gap-sm">
            <h2 className="text-display-md text-ink">{pool.name}</h2>
            {pool.assetClass && <Badge variant="soft">{pool.assetClass}</Badge>}
          </div>
          <p className="mt-xxs max-w-[70ch] text-body-md text-ink-mute">{pool.gateDescription}</p>
          {pool.riskProfile && (
            <p className="mt-xxs text-caption text-ink-mute">{pool.riskProfile}</p>
          )}
        </div>
        <button onClick={onClose} className="rounded-sm p-xs text-ink-mute hover:bg-ink/5 hover:text-ink" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-lg grid gap-lg lg:grid-cols-[1.1fr_1fr]">
        {/* Gate */}
        <div className="rounded-lg border border-hairline bg-canvas-soft p-lg">
          <p className="flex items-center gap-xs text-caption font-medium text-accent">
            <ShieldCheck className="h-4 w-4" /> The gate
          </p>
          <p className="mt-xs text-body-md text-ink-secondary">
            To enter, you prove you are one of these accredited{" "}
            <Term define="leaf">leaves</Term> and that your amount fits your cap. The individual leaves are the
            issuer&rsquo;s private list. Only the <Term define="merkle tree">root</Term> is public.
          </p>
          <GatePreview root={pool.currentRoot} leafCount={pool.leafCount} />
          <dl className="mt-md grid grid-cols-2 gap-md text-caption">
            <div>
              <dt className="text-ink-mute">Per-investor cap</dt>
              <dd className="tnum text-body-md text-ink">{formatMockUsdc(pool.perInvestorCapPublic)} {MOCK_USDC.ticker}</dd>
            </div>
            <div>
              <dt className="text-ink-mute">Issuer</dt>
              <dd className="mono text-[12px] text-ink">{truncate(pool.issuer, 4, 4)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-ink-mute">Current root</dt>
              <dd className="mt-xxs"><HashChip value={pool.currentRoot} /></dd>
            </div>
          </dl>
          <Button className="mt-lg" onClick={onSubscribe}>
            <Lock className="h-4 w-4" /> Subscribe to this pool
          </Button>
        </div>

        {/* Live stream for this pool */}
        <div>
          <div className="mb-sm flex items-center justify-between">
            <p className="text-heading-sm text-ink">Live subscribers</p>
            <Badge variant="neutral">{pool.subscriberCount} total</Badge>
          </div>
          <MySubscriptions poolId={pool.id} />
          {pool.subscriberCount === 0 && (
            <p className="text-body-md text-ink-mute">No subscriptions yet. This is an early, honest number.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Sealed-gate preview: public root over hidden leaves. */
function GatePreview({ root, leafCount }: { root: string; leafCount: number }) {
  return (
    <div className="mt-md rounded-lg border border-hairline bg-card p-md">
      <div className="flex flex-col items-center gap-sm">
        <div className="rounded-md border border-accent/40 bg-accent-soft px-md py-xs">
          <span className="text-micro-cap uppercase tracking-wide text-accent">public root</span>
          <div className="mono text-[11px] text-ink">{truncate(root, 8, 6)}</div>
        </div>
        <div className="h-4 w-px bg-hairline-strong" />
        <div className="flex flex-wrap justify-center gap-xs">
          {Array.from({ length: leafCount }).map((_, i) => (
            <span
              key={i}
              className="flex h-7 w-9 items-center justify-center rounded-sm border border-hairline bg-canvas-sunken"
              title="Sealed accredited leaf (private to the issuer)"
            >
              <Lock className="h-3 w-3 text-ink-mute" />
            </span>
          ))}
        </div>
        <p className="text-micro text-ink-mute">{leafCount} sealed leaves</p>
      </div>
    </div>
  );
}
