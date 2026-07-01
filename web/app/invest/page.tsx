"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Wallet, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PoolCard } from "@/components/invest/pool-card";
import { PoolInspect } from "@/components/invest/pool-inspect";
import { PoolCompare } from "@/components/invest/pool-compare";
import { MySubscriptions } from "@/components/invest/my-subscriptions";
import { useWallet } from "@/lib/stellar/wallet";
import { usePools, useMockUsdcBalance } from "@/lib/hooks/use-pool";
import { decodeError } from "@/lib/errors";
import { formatMockUsdc } from "@/lib/utils";
import { MOCK_USDC, EXTERNAL_LINKS } from "@/lib/backend-config";
import type { PoolMarket } from "@/lib/api";

const SubscribeModal = dynamic(
  () => import("@/components/invest/subscribe-modal").then((m) => m.SubscribeModal),
  { ssr: false },
);

export default function InvestPage() {
  const { address, available, init, connect } = useWallet();
  const { data: pools, isLoading } = usePools();
  const { data: balance } = useMockUsdcBalance(address);

  const [open, setOpen] = React.useState(false);
  const [modalMounted, setModalMounted] = React.useState(false);
  const [modalPool, setModalPool] = React.useState<PoolMarket | null>(null);
  const [inspectId, setInspectId] = React.useState<string | null>(null);

  React.useEffect(() => {
    void init();
  }, [init]);

  const firstRun = available !== null && !address;
  const list = pools ?? [];
  const inspected = list.find((p) => p.id === inspectId) ?? null;

  const subscribeTo = (pool: PoolMarket) => {
    setModalPool(pool);
    setModalMounted(true);
    setOpen(true);
  };

  return (
    <div className="mx-auto max-w-container px-lg py-xxl">
      {/* Hero band */}
      <div className="flex flex-col items-start justify-between gap-md md:flex-row md:items-end">
        <div>
          <Badge variant="neutral">Marketplace · testnet</Badge>
          <h1 className="mt-md text-display-lg text-ink">Choose a pool. Subscribe privately.</h1>
          <p className="mt-xs max-w-[56ch] text-body-md text-ink-mute">
            Three real pools on Stellar testnet, each with its own gate and cap. Every number below is on-chain.
          </p>
        </div>
        {address && (
          <div className="flex items-center gap-sm rounded-lg border border-hairline bg-card px-lg py-md">
            <Wallet className="h-4 w-4 text-ink-mute" />
            <div>
              <p className="tnum text-body-md text-ink">
                {balance !== undefined ? formatMockUsdc(balance) : "…"} {MOCK_USDC.ticker}
              </p>
              <p className="text-micro text-ink-mute">connected balance</p>
            </div>
          </div>
        )}
      </div>

      {/* First-run primer */}
      {firstRun && (
        <div className="mt-xl rounded-xl border border-hairline bg-canvas-soft p-xl">
          <h2 className="text-heading-md text-ink">New here? Two minutes, one device.</h2>
          <p className="mt-xs max-w-[64ch] text-body-md text-ink-secondary">
            PoolPass on testnet uses {MOCK_USDC.labelLong}, a 7-decimal token, not Circle USDC. You can accredit and
            prove with no wallet. Only the final subscribe step needs a Freighter wallet and testnet funds.
          </p>
          <div className="mt-md flex flex-wrap gap-sm">
            {available === false ? (
              <Button asChild size="sm" variant="secondary">
                <a href={EXTERNAL_LINKS.freighterInstall} target="_blank" rel="noreferrer">
                  <Wallet className="h-4 w-4" /> Get Freighter
                </a>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await connect();
                  } catch (e) {
                    toast.error(decodeError(e).title, { description: decodeError(e).message });
                  }
                }}
              >
                <Wallet className="h-4 w-4" /> Connect wallet
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Compare strip */}
      {list.length > 0 && (
        <div className="mt-xl">
          <PoolCompare pools={list} onInspect={setInspectId} />
        </div>
      )}

      {/* Pool grid */}
      <div className="mt-lg grid gap-lg md:grid-cols-2 lg:grid-cols-3">
        {isLoading && list.length === 0
          ? [0, 1, 2].map((i) => <PoolCard key={i} onSubscribe={() => {}} />)
          : list.map((pool) => (
              <PoolCard
                key={pool.id}
                pool={pool}
                onSubscribe={() => subscribeTo(pool)}
                onInspect={() => setInspectId(pool.id)}
              />
            ))}
      </div>

      {list.length === 0 && !isLoading && (
        <Card className="mt-lg p-xl">
          <p className="flex items-center gap-sm text-body-md text-ink-mute">
            <ShieldCheck className="h-4 w-4" /> Pools are loading from the marketplace service. Start it with{" "}
            <span className="mono text-[13px]">pnpm api</span> if this persists.
          </p>
        </Card>
      )}

      {/* Inspect panel */}
      {inspected && (
        <div className="mt-huge">
          <PoolInspect pool={inspected} onSubscribe={() => subscribeTo(inspected)} onClose={() => setInspectId(null)} />
        </div>
      )}

      {/* Global recent stream (shows the optimistic entry right after a subscribe) */}
      <div className="mt-huge">
        <MySubscriptions />
      </div>

      {modalMounted && (
        <SubscribeModal
          open={open}
          onOpenChange={setOpen}
          poolId={modalPool?.id}
          pool={
            modalPool
              ? { name: modalPool.name, capBaseUnits: modalPool.perInvestorCapPublic, contractId: modalPool.contractId }
              : undefined
          }
        />
      )}
    </div>
  );
}
