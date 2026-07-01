"use client";

import { Lock, ShieldCheck, Users, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HashChip } from "@/components/shared/copy";
import { formatMockUsdc } from "@/lib/utils";
import { MOCK_USDC } from "@/lib/backend-config";
import type { PoolMarket } from "@/lib/api";

/**
 * Marketplace card. Every value is real and on-chain (from GET /pools). The gate
 * is the headline identity; there is no APY, because the contract has no yield field.
 */
export function PoolCard({
  pool,
  onSubscribe,
  onInspect,
}: {
  pool?: PoolMarket;
  loading?: boolean;
  onSubscribe: () => void;
  onInspect?: () => void;
}) {
  if (!pool) {
    return (
      <Card className="p-xl">
        <div className="h-5 w-40 animate-pulse rounded bg-ink/10" />
        <div className="mt-lg h-16 w-full animate-pulse rounded bg-ink/5" />
        <div className="mt-xl h-10 w-full animate-pulse rounded-pill bg-ink/10" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col p-xl">
      <div className="flex items-start justify-between gap-sm">
        <h3 className="text-heading-lg text-ink">{pool.name}</h3>
        <Badge variant="neutral">epoch {pool.epoch}</Badge>
      </div>
      <p className="mt-xs min-h-[42px] text-body-md text-ink-mute">{pool.gateDescription}</p>

      {/* Gate as headline identity (replaces APY) */}
      <div className="mt-md rounded-lg border border-accent-soft bg-accent-soft/50 p-md">
        <p className="flex items-center gap-xs text-caption font-medium text-accent">
          <ShieldCheck className="h-4 w-4" /> The gate
        </p>
        <p className="mt-xxs text-body-md text-ink">Prove you are on the list, and your amount fits your cap.</p>
      </div>

      <dl className="mt-lg grid grid-cols-2 gap-md text-caption">
        <div>
          <dt className="text-ink-mute">Per-investor cap</dt>
          <dd className="tnum text-body-md text-ink">
            {formatMockUsdc(pool.perInvestorCapPublic)} {MOCK_USDC.ticker}
          </dd>
        </div>
        <div>
          <dt className="text-ink-mute">Gate</dt>
          <dd className="tnum text-body-md text-ink">
            depth {pool.merkleDepth} · {pool.leafCount} leaves
          </dd>
        </div>
        <div>
          <dt className="text-ink-mute">Subscribers</dt>
          <dd className="tnum text-body-md text-ink">
            <Users className="mr-xxs inline h-3.5 w-3.5 text-ink-mute" />
            {pool.subscriberCount}
          </dd>
        </div>
        <div>
          <dt className="text-ink-mute">Volume</dt>
          <dd className="tnum text-body-md text-ink">
            {formatMockUsdc(pool.subscribedVolume)} {MOCK_USDC.ticker}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-ink-mute">Current root</dt>
          <dd className="mt-xxs"><HashChip value={pool.currentRoot} /></dd>
        </div>
      </dl>

      <div className="mt-xl flex gap-sm">
        <Button className="flex-1" onClick={onSubscribe}>
          <Lock className="h-4 w-4" /> Subscribe privately
        </Button>
        {onInspect && (
          <Button variant="secondary" onClick={onInspect}>
            Inspect <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="mt-sm text-center text-micro text-ink-mute">
        Uses {MOCK_USDC.labelLong}, a 7-decimal token. No real money.
      </p>
    </Card>
  );
}
