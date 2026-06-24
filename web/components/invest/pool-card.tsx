"use client";

import { Lock, TrendingUp, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { InfoTip } from "@/components/ui/tooltip";
import { HashChip } from "@/components/shared/copy";
import { formatMockUsdc, truncate } from "@/lib/utils";
import { MOCK_USDC } from "@/lib/backend-config";
import type { PoolInfo } from "@/lib/stellar/client";

export function PoolCard({
  pool,
  loading,
  onSubscribe,
}: {
  pool?: PoolInfo;
  loading?: boolean;
  onSubscribe: () => void;
}) {
  if (loading || !pool) {
    return (
      <Card className="p-xl">
        <div className="h-5 w-32 animate-pulse rounded bg-ink/10" />
        <div className="mt-lg h-2 w-full animate-pulse rounded bg-ink/10" />
        <div className="mt-xl h-10 w-full animate-pulse rounded-pill bg-ink/10" />
      </Card>
    );
  }

  const cap = pool.per_investor_cap_public; // null => no public per-investor cap
  const subscribed = pool.total_subscribed;
  const pct = cap && cap > 0n ? Math.min(100, Number((subscribed * 100n) / cap)) : 0;

  return (
    <Card className="flex flex-col p-xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-sm">
            <h3 className="text-heading-lg text-ink">{pool.pool_name}</h3>
            <Badge variant="soft">Demo Issuer</Badge>
          </div>
          <p className="mt-xxs text-caption text-ink-mute">
            Issuer {truncate(pool.issuer, 4, 4)} · epoch {pool.epoch}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-xxs">
            <span className="tnum text-display-md font-light text-ink">8.4%</span>
            <InfoTip label="Indicative display APY for the demo. Not a yield commitment; testnet only.">
              <Info className="h-3.5 w-3.5 text-ink-mute" />
            </InfoTip>
          </div>
          <p className="text-micro-cap uppercase tracking-wide text-ink-mute">
            <TrendingUp className="mr-xxs inline h-3 w-3" /> indicative APY
          </p>
        </div>
      </div>

      <div className="mt-xl">
        <div className="flex items-center justify-between text-caption">
          <span className="text-ink-mute">Total subscribed</span>
          <span className="tnum text-ink">
            {formatMockUsdc(subscribed)} {MOCK_USDC.labelShort}
            {cap ? ` / ${formatMockUsdc(cap)} cap` : ""}
          </span>
        </div>
        <Progress value={pct} className="mt-sm" />
      </div>

      <dl className="mt-xl grid grid-cols-2 gap-md text-caption">
        <div>
          <dt className="text-ink-mute">Per-investor cap</dt>
          <dd className="tnum text-body-md text-ink">
            {cap ? `${formatMockUsdc(cap)} ${MOCK_USDC.ticker}` : "No public cap"}
          </dd>
        </div>
        <div>
          <dt className="text-ink-mute">Merkle depth</dt>
          <dd className="tnum text-body-md text-ink">{pool.merkle_depth} · 8 leaves</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-ink-mute">Current root</dt>
          <dd className="mt-xxs"><HashChip value={pool.merkle_root} /></dd>
        </div>
      </dl>

      <Button className="mt-xl" onClick={onSubscribe}>
        <Lock className="h-4 w-4" /> Subscribe privately
      </Button>
      <p className="mt-sm text-center text-micro text-ink-mute">
        Uses {MOCK_USDC.labelLong}, a 7-decimal token. No real money.
      </p>
    </Card>
  );
}
