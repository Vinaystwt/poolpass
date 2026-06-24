"use client";

import { BadgeCheck, Clock, FileDigit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HashChip, CopyButton } from "@/components/shared/copy";
import { Term } from "@/components/shared/term";
import { decodePublicInputs } from "@/lib/zk/assemble";
import { formatMockUsdc } from "@/lib/utils";
import { MOCK_USDC } from "@/lib/backend-config";
import type { ProveOutput } from "@/lib/hooks/use-prover";

export function ProofResult({ out }: { out: ProveOutput }) {
  const decoded = decodePublicInputs(out.result.publicSignals);
  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-wrap items-center gap-md">
        <Badge variant={out.verified ? "success" : "danger"}>
          <BadgeCheck className="h-3 w-3" /> {out.verified ? "Verified locally" : "Verification failed"}
        </Badge>
        <span className="inline-flex items-center gap-xs text-caption text-ink-mute">
          <FileDigit className="h-3.5 w-3.5" /> {out.proofBytesLen}-byte proof
        </span>
        <span className="inline-flex items-center gap-xs text-caption text-ink-mute">
          <Clock className="h-3.5 w-3.5" /> {out.timings.totalMs} ms on your machine
        </span>
      </div>

      <div className="grid grid-cols-3 gap-sm rounded-lg border border-hairline bg-canvas-soft p-md text-center">
        {[
          ["Witness", out.timings.witnessMs],
          ["Prove", out.timings.proveMs],
          ["Verify", out.timings.verifyMs],
        ].map(([label, ms]) => (
          <div key={label as string}>
            <p className="tnum text-display-md font-light text-ink">{ms as number}</p>
            <p className="text-micro-cap uppercase tracking-wide text-ink-mute">{label as string} · ms</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-xs text-micro-cap uppercase tracking-wide text-ink-mute">
          <Term define="public inputs">Public inputs</Term> · [merkle_root, amount, nullifier, epoch]
        </p>
        <dl className="divide-y divide-hairline rounded-lg border border-hairline">
          <Row label={<Term define="merkle tree">merkle_root</Term>} value={<HashChip value={decoded.merkle_root} />} />
          <Row
            label="amount"
            value={
              <span className="tnum text-body-md text-ink">
                {formatMockUsdc(decoded.amount)} {MOCK_USDC.labelShort}
                <span className="ml-xs text-caption text-ink-mute">({decoded.amount} base units)</span>
              </span>
            }
          />
          <Row label={<Term define="nullifier">nullifier</Term>} value={<HashChip value={decoded.nullifier} />} />
          <Row label={<Term define="epoch">epoch</Term>} value={<span className="tnum text-body-md text-ink">{decoded.epoch}</span>} />
        </dl>
      </div>

      <div className="flex items-center justify-between rounded-md border border-hairline bg-canvas-soft px-md py-sm">
        <span className="text-caption text-ink-mute">Serialized proof bytes (256), ready to feed subscribe</span>
        <CopyButton value={out.proofHex} label="Proof bytes" />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-md px-md py-sm">
      <dt className="mono text-[12px] text-ink-mute">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
