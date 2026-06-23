"use client";

import * as React from "react";
import { Wallet, AlertTriangle, LogOut, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/lib/stellar/wallet";
import { decodeError } from "@/lib/errors";
import { truncate, stellarExpertAccount } from "@/lib/utils";
import { EXTERNAL_LINKS } from "@/lib/backend-config";
import { Button } from "@/components/ui/button";

export function WalletPill() {
  const { address, available, connecting, wrongNetwork, init, connect, disconnect } = useWallet();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    void init();
  }, [init]);

  if (available === false) {
    return (
      <Button asChild size="sm" variant="secondary">
        <a href={EXTERNAL_LINKS.freighterInstall} target="_blank" rel="noreferrer">
          <Wallet className="h-4 w-4" /> Install Freighter
        </a>
      </Button>
    );
  }

  if (!address) {
    return (
      <Button
        size="sm"
        onClick={async () => {
          try {
            await connect();
          } catch (e) {
            const f = decodeError(e);
            toast.error(f.title, { description: f.message });
          }
        }}
        disabled={connecting}
      >
        <Wallet className="h-4 w-4" /> {connecting ? "Connecting…" : "Connect wallet"}
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-sm rounded-pill border border-hairline bg-card px-md py-xs text-body-md text-ink transition-colors hover:border-primary"
      >
        {wrongNetwork ? (
          <AlertTriangle className="h-4 w-4 text-ruby" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        )}
        <span className="mono text-[13px]">{truncate(address, 4, 4)}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-xs w-[240px] rounded-lg border border-hairline bg-card p-xs shadow-e2">
            {wrongNetwork && (
              <div className="mb-xs rounded-md bg-ruby/10 px-md py-sm text-caption text-ruby">
                Wrong network. Switch Freighter to Testnet.
              </div>
            )}
            <a
              href={stellarExpertAccount(address)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-md px-md py-sm text-body-md text-ink hover:bg-ink/5"
            >
              View on Explorer <ExternalLink className="h-3.5 w-3.5 text-ink-mute" />
            </a>
            <button
              type="button"
              onClick={() => {
                disconnect();
                setOpen(false);
                toast.message("Disconnected");
              }}
              className="flex w-full items-center justify-between rounded-md px-md py-sm text-body-md text-ink hover:bg-ink/5"
            >
              Disconnect <LogOut className="h-3.5 w-3.5 text-ink-mute" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
