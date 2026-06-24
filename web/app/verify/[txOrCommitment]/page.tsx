"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ShieldX, ExternalLink, Cpu, ServerCog, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HashChip } from "@/components/shared/copy";
import { useProver } from "@/lib/hooks/use-prover";
import { fetchEvents, verifyBackend } from "@/lib/api";
import { findSubscription } from "@/lib/indexer";
import { deserializeProof } from "@/lib/zk/serialize";
import { hexToBytes } from "@/lib/zk/field";
import { decodePublicInputs } from "@/lib/zk/decode";
import { formatMockUsdc, stellarExpertTx, truncate } from "@/lib/utils";
import { MOCK_USDC } from "@/lib/backend-config";

interface TxProof {
  hash: string;
  investor: string;
  amount: string;
  proofHex: string;
  publicSignalsHex: string[];
  publicSignals: string[];
}

type Verdict = { valid: boolean; ms: number; via: "browser" | "backend" } | null;

export default function VerifyPage({ params }: { params: { txOrCommitment: string } }) {
  const key = decodeURIComponent(params.txOrCommitment);
  const { verify } = useProver();
  const [browserVerdict, setBrowserVerdict] = React.useState<Verdict>(null);
  const [backendVerdict, setBackendVerdict] = React.useState<Verdict>(null);
  const [verifying, setVerifying] = React.useState<"browser" | "backend" | null>(null);

  // Resolve the indexer record (gives metadata + the tx hash for a commitment key).
  const { data: indexer } = useQuery({ queryKey: ["indexer"], queryFn: fetchEvents });
  const sub = indexer ? findSubscription(indexer, key) : null;
  const txHash = sub?.txHash ?? (key.length >= 60 ? key : null);

  // Reconstruct proof + public inputs from the on-chain transaction.
  const { data: txProof, isLoading, error } = useQuery<TxProof>({
    queryKey: ["tx-proof", txHash],
    queryFn: async () => {
      const res = await fetch(`/api/tx-proof/${txHash}`);
      if (!res.ok) throw new Error((await res.json()).message || "Could not decode proof from transaction");
      return res.json();
    },
    enabled: Boolean(txHash),
  });

  const proofObject = React.useMemo(
    () => (txProof ? deserializeProof(hexToBytes(txProof.proofHex)) : null),
    [txProof],
  );
  const decoded = txProof ? decodePublicInputs(txProof.publicSignals) : null;

  const runBrowser = async () => {
    if (!proofObject || !txProof) return;
    setVerifying("browser");
    try {
      const { valid, verifyMs } = await verify(proofObject, txProof.publicSignals);
      setBrowserVerdict({ valid, ms: verifyMs, via: "browser" });
    } finally {
      setVerifying(null);
    }
  };

  const runBackend = async () => {
    if (!proofObject || !txProof) return;
    setVerifying("backend");
    const t0 = performance.now();
    try {
      const { valid } = await verifyBackend(proofObject, txProof.publicSignals);
      setBackendVerdict({ valid, ms: Math.round(performance.now() - t0), via: "backend" });
    } finally {
      setVerifying(null);
    }
  };

  const downloadProof = () => {
    if (!txProof) return;
    const blob = new Blob([JSON.stringify({ proof: proofObject, publicSignals: txProof.publicSignals }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poolpass-proof-${truncate(txProof.hash, 6, 4)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[820px] px-lg py-xxl">
      <Badge variant="proof">Public verification</Badge>
      <h1 className="mt-md text-display-lg text-ink">Verify this subscription.</h1>
      <p className="mt-sm max-w-[60ch] text-body-lg text-ink-secondary">
        We do not ask you to trust us; we ask you to run the math. Anyone — no wallet required — can confirm this
        subscription against the proof recorded on Stellar.
      </p>

      {!txHash && (
        <Card className="mt-xl p-xl">
          <p className="text-body-md text-ink-mute">
            No subscription found for <span className="mono text-[13px]">{truncate(key, 10, 8)}</span>. Provide a
            subscription transaction hash or commitment.
          </p>
        </Card>
      )}

      {isLoading && (
        <Card className="mt-xl flex items-center gap-sm p-xl">
          <Loader2 className="h-4 w-4 animate-spin text-ink-mute" />
          <span className="text-body-md text-ink-mute">Decoding the proof from the transaction…</span>
        </Card>
      )}

      {error && (
        <Card className="mt-xl p-xl">
          <p className="text-body-md text-ruby">{(error as Error).message}</p>
          <p className="mt-xs text-caption text-ink-mute">
            The transaction may be outside the RPC retention window. The proof can still be verified from a downloaded
            package on the Prove page.
          </p>
        </Card>
      )}

      {txProof && decoded && (
        <>
          {/* Verdict */}
          <Card className="mt-xl p-xl">
            <div className="grid gap-lg md:grid-cols-2">
              <VerdictTile
                title="Verify in your browser"
                icon={Cpu}
                verdict={browserVerdict}
                loading={verifying === "browser"}
                onRun={runBrowser}
                accent
              />
              <VerdictTile
                title="Verify via backend"
                icon={ServerCog}
                verdict={backendVerdict}
                loading={verifying === "backend"}
                onRun={runBackend}
              />
            </div>
            <p className="mt-lg text-caption text-ink-mute">
              Both checks run the Groth16 pairing equation against the committed PoolPass verifying key.{" "}
              <a href="/docs/mathematics" className="text-primary hover:underline">
                What is being verified?
              </a>
            </p>
          </Card>

          {/* Metadata */}
          <div className="mt-lg grid gap-lg md:grid-cols-2">
            <Card className="p-xl">
              <h3 className="text-heading-sm text-ink">Subscription</h3>
              <dl className="mt-md flex flex-col gap-sm text-body-md">
                <Meta label="Amount">
                  <span className="tnum text-ink">
                    {formatMockUsdc(txProof.amount)} {MOCK_USDC.labelShort}
                  </span>
                </Meta>
                <Meta label="Epoch"><span className="tnum text-ink">{decoded.epoch}</span></Meta>
                <Meta label="Investor"><span className="mono text-[12px] text-ink">{truncate(txProof.investor, 6, 6)}</span></Meta>
                {sub && <Meta label="When"><span className="text-ink-mute">{new Date(sub.closedAt).toLocaleString()}</span></Meta>}
                <Meta label="Transaction">
                  <a href={stellarExpertTx(txProof.hash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-xxs text-primary">
                    {truncate(txProof.hash, 6, 4)} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Meta>
              </dl>
            </Card>

            <Card className="p-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-heading-sm text-ink">Proof & public inputs</h3>
                <Button variant="ghost" size="sm" onClick={downloadProof}>
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
              <dl className="mt-md flex flex-col gap-sm">
                <Meta label="merkle_root"><HashChip value={decoded.merkle_root} /></Meta>
                <Meta label="nullifier"><HashChip value={decoded.nullifier} /></Meta>
                <Meta label="proof"><span className="text-caption text-ink-mute">{txProof.proofHex.length / 2} bytes</span></Meta>
              </dl>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function VerdictTile({
  title,
  icon: Icon,
  verdict,
  loading,
  onRun,
  accent,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  verdict: Verdict;
  loading: boolean;
  onRun: () => void;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-lg ${
        verdict ? (verdict.valid ? "border-positive/40 bg-positive/5" : "border-danger/40 bg-danger/5") : "border-hairline"
      }`}
    >
      <div className="flex items-center gap-sm">
        <Icon className={`h-4 w-4 ${accent ? "text-accent-proof" : "text-ink-mute"}`} />
        <p className="text-body-md text-ink">{title}</p>
      </div>
      {verdict ? (
        <div className="mt-md animate-fade-up">
          <div className="flex items-center gap-sm">
            {verdict.valid ? (
              <ShieldCheck className="h-6 w-6 text-positive" />
            ) : (
              <ShieldX className="h-6 w-6 text-danger" />
            )}
            <span className={`text-heading-md ${verdict.valid ? "text-positive" : "text-danger"}`}>
              {verdict.valid ? "Valid proof" : "Invalid proof"}
            </span>
          </div>
          <p className="mt-xs text-caption text-ink-mute">Verified in {verdict.ms} ms</p>
        </div>
      ) : (
        <Button
          variant={accent ? "proof" : "secondary"}
          className="mt-md w-full"
          onClick={onRun}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Verifying…" : "Verify"}
        </Button>
      )}
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-md">
      <dt className="mono text-[12px] text-ink-mute">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
