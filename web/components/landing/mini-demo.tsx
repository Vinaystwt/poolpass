"use client";

import { Cpu } from "lucide-react";
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
          <div>
            <p className="text-heading-sm text-ink">Run a real proof, right here</p>
            <p className="text-caption text-ink-mute">No wallet. No signup. Your machine does the math.</p>
          </div>
        </div>
        <Badge variant="proof">snarkjs · wasm</Badge>
      </div>
      <p className="mt-md rounded-md bg-canvas-sunken px-md py-sm text-caption text-ink-mute">
        This runs a real proof for a sample investor. It does not touch your wallet, and none of your data is used.
      </p>
      <div className="mt-md">
        <ProofConsole
          pkg={DEMO_PROOF_PACKAGE}
          amountBaseUnits={DEMO_PROOF_PACKAGE.amount ?? "25000000000"}
          allowFallback={false}
        />
      </div>
      <p className="mt-md text-caption text-ink-mute">
        When it finishes: you have proven the sample investor is on the list and within their cap. Their identity and
        amount were never revealed.
      </p>
    </div>
  );
}
