"use client";

import * as React from "react";
import { Upload, Sigma } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { FilePicker } from "@/components/shared/file-picker";
import dynamic from "next/dynamic";
const ProofConsole = dynamic(
  () => import("@/components/proof/proof-console").then((m) => m.ProofConsole),
  {
    ssr: false,
    loading: () => <div className="h-40 w-full animate-pulse rounded-lg bg-ink/5" />,
  },
);
import { isProofPackage } from "@/lib/zk/decode";
import { DEMO_PROOF_PACKAGE } from "@/lib/zk/demo";
import { formatMockUsdc } from "@/lib/utils";
import { toast } from "sonner";
import type { ProofPackage } from "@/lib/zk/types";

export default function ProvePage() {
  const [pkg, setPkg] = React.useState<ProofPackage>(DEMO_PROOF_PACKAGE);
  const [paste, setPaste] = React.useState("");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("poolpass-proof-package");
      if (raw) setPkg(JSON.parse(raw));
    } catch {
      /* no saved package */
    }
  }, []);

  const load = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!isProofPackage(parsed)) throw new Error("Not a valid proof package");
      setPkg({ ...parsed, amount: parsed.amount ?? "25000000000" });
      toast.success("Proof package loaded");
    } catch (e) {
      toast.error("Could not read package", { description: e instanceof Error ? e.message : "Invalid JSON" });
    }
  };

  return (
    <div className="mx-auto max-w-[820px] px-lg py-xxl">
      <Badge variant="proof">Standalone prover</Badge>
      <h1 className="mt-md text-display-lg text-ink">Generate a proof.</h1>
      <p className="mt-sm max-w-[62ch] text-body-lg text-ink-secondary">
        Drop a proof package from an issuer, or use the baked demo input. The proof runs in your browser, no wallet,
        no account. Watch the witness, prove, and verify stages run on your own machine.
      </p>

      <Card className="mt-xl p-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-heading-sm text-ink">{pkg.label ?? "Proof package"}</p>
            <p className="text-caption text-ink-mute">
              epoch {pkg.epoch} · amount {formatMockUsdc(pkg.amount ?? "0")} Testnet USDC
            </p>
          </div>
          <Badge variant={pkg.label?.includes("Demo") ? "neutral" : "success"}>
            {pkg.label?.includes("Demo") ? "baked input" : "loaded"}
          </Badge>
        </div>

        <div className="mt-lg">
          <ProofConsole pkg={pkg} amountBaseUnits={pkg.amount ?? "25000000000"} allowFallback />
        </div>
      </Card>

      <details className="mt-lg rounded-lg border border-hairline p-xl">
        <summary className="flex cursor-pointer items-center gap-sm text-body-md text-ink">
          <Upload className="h-4 w-4 text-ink-mute" /> Load a different proof package
        </summary>
        <div className="mt-md flex flex-col gap-sm">
          <FilePicker accept="application/json" label="Choose package file" onFile={async (file) => load(await file.text())} />
          <Textarea rows={5} placeholder="Paste proof package JSON…" value={paste} onChange={(e) => setPaste(e.target.value)} />
          <Button variant="outline" size="sm" disabled={!paste.trim()} onClick={() => load(paste)}>
            Load pasted package
          </Button>
        </div>
      </details>

      <details className="mt-lg rounded-lg border border-hairline p-xl">
        <summary className="flex cursor-pointer items-center gap-sm text-body-md text-ink">
          <Sigma className="h-4 w-4 text-accent-proof" /> What this circuit proves
        </summary>
        <div className="mt-md space-y-sm text-body-md text-ink-secondary">
          <p>The PoolPass circuit proves four statements at once, revealing none of the private inputs:</p>
          <ol className="ml-lg list-decimal space-y-xs">
            <li>
              You know <span className="mono text-[12px]">investor_id</span>,{" "}
              <span className="mono text-[12px]">cap</span>, and{" "}
              <span className="mono text-[12px]">investor_secret</span> whose leaf{" "}
              <span className="mono text-[12px]">Poseidon3(id, cap, secret)</span> sits in the committed Merkle tree.
            </li>
            <li>The Merkle path of depth 3 hashes up to the public <span className="mono text-[12px]">merkle_root</span>.</li>
            <li>The public <span className="mono text-[12px]">amount</span> does not exceed your private <span className="mono text-[12px]">cap</span>.</li>
            <li>
              The public <span className="mono text-[12px]">nullifier</span> equals{" "}
              <span className="mono text-[12px]">Poseidon2(secret, epoch)</span>, binding the proof to one subscription
              per epoch.
            </li>
          </ol>
          <p>
            Read the full statement and a worked 8-leaf example in the{" "}
            <a href="/docs/mathematics" className="text-primary hover:underline">
              mathematics
            </a>{" "}
            section.
          </p>
        </div>
      </details>
    </div>
  );
}
