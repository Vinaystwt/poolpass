"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Wallet, Coins, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PoolCard } from "@/components/invest/pool-card";
import { MySubscriptions } from "@/components/invest/my-subscriptions";
import { useWallet } from "@/lib/stellar/wallet";

// Defer the proof stack (snarkjs worker, circomlibjs, proof console) out of the
// initial /invest bundle; it loads only when the user opens the subscribe modal.
const SubscribeModal = dynamic(
  () => import("@/components/invest/subscribe-modal").then((m) => m.SubscribeModal),
  { ssr: false },
);
import { usePoolInfo, useMockUsdcBalance } from "@/lib/hooks/use-pool";
import { faucet } from "@/lib/api";
import { decodeError } from "@/lib/errors";
import { formatMockUsdc } from "@/lib/utils";
import { MOCK_USDC, EXTERNAL_LINKS } from "@/lib/backend-config";
import { toast } from "sonner";

export default function InvestPage() {
  const { address, available, init, connect } = useWallet();
  const { data: pool, isLoading } = usePoolInfo();
  const { data: balance, refetch } = useMockUsdcBalance(address);
  const [open, setOpen] = React.useState(false);
  const [modalMounted, setModalMounted] = React.useState(false);

  const openModal = () => {
    setModalMounted(true);
    setOpen(true);
  };

  React.useEffect(() => {
    void init();
  }, [init]);

  const firstRun = available !== null && !address;

  return (
    <div className="mx-auto max-w-container px-lg py-xxl">
      {/* Hero band */}
      <div className="flex flex-col items-start justify-between gap-md md:flex-row md:items-end">
        <div>
          <Badge variant="proof">Investor app · testnet</Badge>
          <h1 className="mt-md text-display-lg text-ink">Subscribe privately to a real-world-asset pool.</h1>
        </div>
        {address && (
          <div className="flex items-center gap-sm rounded-lg border border-hairline bg-card px-lg py-md">
            <Wallet className="h-4 w-4 text-primary" />
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
        <div className="mt-xl rounded-xl border border-primary/20 bg-primary/[0.04] p-xl">
          <h2 className="text-heading-md text-ink">New here? Two minutes, one device.</h2>
          <p className="mt-xs max-w-[60ch] text-body-md text-ink-secondary">
            PoolPass on testnet uses {MOCK_USDC.labelLong}, a 7-decimal token, not Circle USDC. Get a wallet, get test
            funds, and try the demo pool. You will accredit yourself, prove in the browser, and subscribe, without
            revealing your identity.
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
            {address && (
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    await faucet(address);
                    toast.success("Faucet sent Mock USDC");
                    setTimeout(() => void refetch(), 2500);
                  } catch (e) {
                    toast.error(decodeError(e).title, { description: decodeError(e).message });
                  }
                }}
              >
                <Coins className="h-4 w-4" /> Get Mock USDC
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Pool grid */}
      <div className="mt-xl grid gap-lg md:grid-cols-2 lg:grid-cols-3">
        <PoolCard pool={pool} loading={isLoading} onSubscribe={openModal} />
      </div>

      {/* Coming-soon band (full width, not a mismatched grid sibling) */}
      <ComingSoonPool />

      {/* Subscriptions */}
      <div className="mt-huge">
        <MySubscriptions />
      </div>

      {modalMounted && <SubscribeModal open={open} onOpenChange={setOpen} pool={pool} />}
    </div>
  );
}

function ComingSoonPool() {
  return (
    <div className="mt-lg flex flex-col items-start gap-md rounded-lg border border-dashed border-hairline p-xl md:flex-row md:items-center md:justify-between">
      <div>
        <Badge variant="neutral">Coming soon</Badge>
        <h3 className="mt-sm text-heading-md text-ink">Multi-issuer pools</h3>
        <p className="mt-xs max-w-[60ch] text-body-md text-ink-mute">
          A pool factory and regulated-issuer onboarding land on the roadmap. Today, one verified demo pool runs the full
          zero-knowledge loop.
        </p>
      </div>
      <Button asChild variant="secondary" size="sm" className="shrink-0">
        <a href="/roadmap">
          See the roadmap <ArrowRight className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}
