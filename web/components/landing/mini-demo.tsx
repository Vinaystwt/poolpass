"use client";

import { Cpu, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProofConsole } from "@/components/proof/proof-console";
import { DEMO_PROOF_PACKAGE } from "@/lib/zk/demo";

export function MiniDemo() {
  return (
    <div className="rounded-xl border border-hairline bg-card p-xl shadow-e2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-proof/10">
            <Cpu className="h-4 w-4 text-accent-proof" />
          </span>
          <p className="text-heading-sm text-ink">See the core of PoolPass in action</p>
        </div>
        <Badge variant="proof">snarkjs · wasm</Badge>
      </div>
      <p className="mt-sm text-body-md text-ink-secondary">
        This generates a real zero-knowledge proof for a sample investor, entirely in your browser, so you can watch
        the privacy step work before you use it yourself.
      </p>
      <p className="mt-md flex items-center gap-xs rounded-md bg-canvas-sunken px-md py-sm text-body-md text-ink">
        <ShieldCheck className="h-4 w-4 shrink-0 text-accent" /> Sample investor. No wallet. None of your data is used.
      </p>
      <div className="mt-md">
        <ProofConsole
          pkg={DEMO_PROOF_PACKAGE}
          amountBaseUnits={DEMO_PROOF_PACKAGE.amount ?? "25000000000"}
          allowFallback={false}
        />
      </div>
      <p className="mt-md text-caption text-ink-mute">
        You just proved the sample investor is on the list and within their cap, with their identity and amount never
        revealed. This is exactly the proof you would generate to join a pool, minus your real details.
      </p>
    </div>
  );
}
