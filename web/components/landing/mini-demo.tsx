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
      <div className="mt-lg">
        <ProofConsole
          pkg={DEMO_PROOF_PACKAGE}
          amountBaseUnits={DEMO_PROOF_PACKAGE.amount ?? "25000000000"}
          allowFallback={false}
        />
      </div>
    </div>
  );
}
