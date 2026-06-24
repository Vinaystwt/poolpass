"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Loader2, ShieldCheck, Upload, Wand2, Coins, ExternalLink, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HashChip } from "@/components/shared/copy";
import { ProofConsole, type ProofConsoleHandle } from "@/components/proof/proof-console";
import { useWallet } from "@/lib/stellar/wallet";
import { useMockUsdcBalance } from "@/lib/hooks/use-pool";
import {
  generateIdentity,
  requestSelfServeAccreditation,
  savePackage,
  type Identity,
} from "@/lib/accreditation";
import { isProofPackage } from "@/lib/zk/assemble";
import { subscribe } from "@/lib/stellar/client";
import { faucet } from "@/lib/api";
import { decodeError } from "@/lib/errors";
import { formatMockUsdc, parseMockUsdc, stellarExpertTx, truncate } from "@/lib/utils";
import { MOCK_USDC } from "@/lib/backend-config";
import type { PoolInfo } from "@/lib/stellar/client";
import type { ProofPackage } from "@/lib/zk/types";

type Step = "accredit" | "prove" | "subscribe";

export function SubscribeModal({
  open,
  onOpenChange,
  pool,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pool: PoolInfo | undefined;
}) {
  const { address, connect, available } = useWallet();
  const { data: balance, refetch: refetchBalance } = useMockUsdcBalance(address);

  const [step, setStep] = React.useState<Step>("accredit");
  const identityRef = React.useRef<Identity | null>(null);
  const [pkg, setPkg] = React.useState<ProofPackage | null>(null);
  const [accrediting, setAccrediting] = React.useState(false);
  const [amountHuman, setAmountHuman] = React.useState("2500");
  const [proofHandle, setProofHandle] = React.useState<ProofConsoleHandle | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<{ hash: string; commitment: string; nullifier: string } | null>(null);
  const [pasteValue, setPasteValue] = React.useState("");

  const amountBaseUnits = React.useMemo(() => {
    try {
      return parseMockUsdc(amountHuman).toString();
    } catch {
      return "0";
    }
  }, [amountHuman]);

  const capExceeded = Boolean(pkg && BigInt(amountBaseUnits) > BigInt(pkg.cap));
  const poolCapExceeded = Boolean(
    pool && pool.per_investor_cap_public != null && BigInt(amountBaseUnits) > pool.per_investor_cap_public,
  );

  const reset = () => {
    setStep("accredit");
    identityRef.current = null;
    setPkg(null);
    setProofHandle(null);
    setResult(null);
    setPasteValue("");
  };

  const onSelfServe = async () => {
    setAccrediting(true);
    try {
      const identity = identityRef.current ?? generateIdentity();
      identityRef.current = identity;
      const newPkg = await requestSelfServeAccreditation(identity, amountBaseUnits);
      setPkg(newPkg);
      savePackage(newPkg);
      toast.success("Accredited", { description: `Root committed at epoch ${newPkg.epoch}` });
      setStep("prove");
    } catch (e) {
      const f = decodeError(e);
      toast.error(f.title, { description: f.message });
    } finally {
      setAccrediting(false);
    }
  };

  const onImport = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!isProofPackage(parsed)) throw new Error("Not a valid proof package");
      const next: ProofPackage = { ...parsed, amount: parsed.amount ?? amountBaseUnits };
      setPkg(next);
      savePackage(next);
      if (parsed.amount) setAmountHuman(formatMockUsdc(parsed.amount).replace(/,/g, ""));
      toast.success("Proof package loaded");
      setStep("prove");
    } catch (e) {
      toast.error("Could not read package", { description: decodeError(e).message });
    }
  };

  const onSubmit = async () => {
    if (!address || !proofHandle?.output) return;
    setSubmitting(true);
    try {
      const { signXdr } = useWallet.getState();
      const res = await subscribe({
        investor: address,
        amount: BigInt(amountBaseUnits),
        proofHex: proofHandle.output.proofHex,
        publicSignalsHex: proofHandle.output.publicSignalsHex,
        sign: signXdr,
      });
      const commitment = typeof res.returnValue === "string" ? res.returnValue : "";
      setResult({
        hash: res.hash,
        commitment: commitment || (proofHandle.output.publicSignalsHex[2] ?? ""),
        nullifier: proofHandle.output.publicSignalsHex[2] ?? "",
      });
      toast.success("Subscribed on testnet");
      void refetchBalance();
    } catch (e) {
      const f = decodeError(e);
      toast.error(f.title, { description: f.message });
    } finally {
      setSubmitting(false);
    }
  };

  const needsFunds = address && balance !== undefined && BigInt(amountBaseUnits) > balance;

  const onFaucet = async () => {
    if (!address) return;
    try {
      await faucet(address);
      toast.success("Faucet sent Mock USDC");
      setTimeout(() => void refetchBalance(), 2500);
    } catch (e) {
      toast.error(decodeError(e).title, { description: decodeError(e).message });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setTimeout(reset, 200);
      }}
    >
      <DialogContent className="max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Subscribe privately</DialogTitle>
          <DialogDescription>
            Accredit, prove in your browser, then subscribe on testnet. Your secret never leaves this device.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <SuccessPanel result={result} amount={amountBaseUnits} onClose={() => onOpenChange(false)} />
        ) : (
          <Tabs value={step} onValueChange={(v) => setStep(v as Step)}>
            <TabsList className="w-full">
              <TabsTrigger value="accredit" className="flex-1">
                {pkg ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : "1"} Accredit
              </TabsTrigger>
              <TabsTrigger value="prove" disabled={!pkg} className="flex-1">
                {proofHandle ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : "2"} Prove
              </TabsTrigger>
              <TabsTrigger value="subscribe" disabled={!proofHandle} className="flex-1">
                3 Subscribe
              </TabsTrigger>
            </TabsList>

            {/* ── Accredit ── */}
            <TabsContent value="accredit">
              <div className="flex flex-col gap-lg">
                <div className="rounded-lg border border-hairline bg-canvas-soft p-lg">
                  <div className="flex items-center gap-sm">
                    <Wand2 className="h-4 w-4 text-primary" />
                    <p className="text-heading-sm text-ink">Request test accreditation</p>
                  </div>
                  <p className="mt-xs text-body-md text-ink-mute">
                    We generate an <span className="mono text-[12px]">investor_id</span> and{" "}
                    <span className="mono text-[12px]">investor_secret</span> on this device, compute your leaf, and
                    send <em>only the leaf hash</em> to the demo issuer. The issuer commits all 8 leaves on-chain and
                    returns your Merkle path.
                  </p>
                  <Button className="mt-md" onClick={onSelfServe} disabled={accrediting}>
                    {accrediting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {accrediting ? "Committing root…" : "Request test accreditation"}
                  </Button>
                </div>

                {pkg && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-lg">
                    <p className="text-caption text-ink-mute">Accreditation returned</p>
                    <dl className="mt-sm grid grid-cols-[auto_1fr] items-center gap-x-md gap-y-xs">
                      <dt className="mono text-[12px] text-ink-mute">root</dt>
                      <dd><HashChip value={pkg.root} /></dd>
                      <dt className="mono text-[12px] text-ink-mute">epoch</dt>
                      <dd className="tnum text-body-md text-ink">{pkg.epoch}</dd>
                      <dt className="mono text-[12px] text-ink-mute">index</dt>
                      <dd className="tnum text-body-md text-ink">{pkg.index}</dd>
                      <dt className="mono text-[12px] text-ink-mute">indices</dt>
                      <dd className="tnum text-body-md text-ink">[{pkg.merkle_indices.join(", ")}]</dd>
                    </dl>
                    <Button variant="ghost" size="sm" className="mt-sm" onClick={() => setStep("prove")}>
                      Continue to prove <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <details className="rounded-lg border border-hairline p-lg">
                  <summary className="flex cursor-pointer items-center gap-sm text-body-md text-ink">
                    <Upload className="h-4 w-4 text-ink-mute" /> I already have a proof package
                  </summary>
                  <div className="mt-md flex flex-col gap-sm">
                    <input
                      type="file"
                      accept="application/json"
                      className="text-caption text-ink-mute file:mr-sm file:rounded-pill file:border-0 file:bg-primary file:px-md file:py-xs file:text-on-primary"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) onImport(await file.text());
                      }}
                    />
                    <Textarea
                      rows={4}
                      placeholder='{"investor_id":"...","investor_secret":"...","root":"...","merkle_path":[...],"merkle_indices":[...],"epoch":1}'
                      value={pasteValue}
                      onChange={(e) => setPasteValue(e.target.value)}
                    />
                    <Button variant="outline" size="sm" disabled={!pasteValue.trim()} onClick={() => onImport(pasteValue)}>
                      Load pasted package
                    </Button>
                  </div>
                </details>
              </div>
            </TabsContent>

            {/* ── Prove ── */}
            <TabsContent value="prove">
              {pkg && (
                <div className="flex flex-col gap-lg">
                  <div>
                    <label className="text-caption text-ink-mute">Amount to subscribe</label>
                    <div className="mt-xs flex items-center gap-sm">
                      <Input
                        value={amountHuman}
                        inputMode="decimal"
                        onChange={(e) => {
                          setAmountHuman(e.target.value);
                          setProofHandle(null); // amount is a public input — changing it invalidates the proof
                        }}
                        className="max-w-[200px] tnum"
                      />
                      <span className="text-body-md text-ink-mute">{MOCK_USDC.labelShort}</span>
                    </div>
                    {(capExceeded || poolCapExceeded) && (
                      <p className="mt-xs text-caption text-ruby">
                        Amount exceeds {capExceeded ? "your cap" : "the pool's per-investor cap"} (
                        {formatMockUsdc(capExceeded ? pkg.cap : (pool?.per_investor_cap_public ?? 0n).toString())}{" "}
                        {MOCK_USDC.labelShort}).
                      </p>
                    )}
                  </div>

                  {BigInt(amountBaseUnits) > 0n && !capExceeded && !poolCapExceeded ? (
                    <ProofConsole
                      key={amountBaseUnits}
                      pkg={pkg}
                      amountBaseUnits={amountBaseUnits}
                      onResult={(h) => {
                        setProofHandle(h);
                        if (h.output?.verified) setStep("subscribe");
                      }}
                    />
                  ) : (
                    <p className="text-caption text-ink-mute">Enter a valid amount to generate a proof.</p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── Subscribe ── */}
            <TabsContent value="subscribe">
              {proofHandle?.output && (
                <div className="flex flex-col gap-lg">
                  <div className="rounded-lg border border-hairline p-lg">
                    <Row label="Amount">
                      <span className="tnum text-body-md text-ink">
                        {formatMockUsdc(amountBaseUnits)} {MOCK_USDC.labelShort}
                      </span>
                    </Row>
                    <Row label="Network fee">
                      <span className="tnum text-body-md text-ink-mute">~0.001 XLM (estimated)</span>
                    </Row>
                    <Row label="Proof">
                      <Badge variant="success">
                        <ShieldCheck className="h-3 w-3" /> verified locally
                      </Badge>
                    </Row>
                    {proofHandle.usedFallback && (
                      <Row label="Path">
                        <span className="text-caption text-ruby">server fallback (private inputs left device)</span>
                      </Row>
                    )}
                  </div>

                  {!address ? (
                    <Button
                      onClick={async () => {
                        try {
                          await connect();
                        } catch (e) {
                          toast.error(decodeError(e).title, { description: decodeError(e).message });
                        }
                      }}
                    >
                      {available === false ? "Install Freighter" : "Connect wallet to subscribe"}
                    </Button>
                  ) : (
                    <>
                      <div className="flex items-center justify-between rounded-md bg-canvas-soft px-md py-sm text-caption">
                        <span className="text-ink-mute">
                          Balance: {balance !== undefined ? formatMockUsdc(balance) : "…"} {MOCK_USDC.labelShort}
                        </span>
                        <button className="text-primary hover:underline" onClick={onFaucet}>
                          <Coins className="mr-xxs inline h-3.5 w-3.5" /> Get test funds
                        </button>
                      </div>
                      {needsFunds && (
                        <p className="text-caption text-ruby">
                          Balance below the subscription amount. Use the faucet, then submit.
                        </p>
                      )}
                      <Button onClick={onSubmit} disabled={submitting || Boolean(needsFunds)}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {submitting ? "Awaiting signature…" : "Sign and submit"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-xs">
      <span className="text-caption text-ink-mute">{label}</span>
      {children}
    </div>
  );
}

function SuccessPanel({
  result,
  amount,
  onClose,
}: {
  result: { hash: string; commitment: string; nullifier: string };
  amount: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center gap-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
          <Check className="h-5 w-5 text-emerald-500" />
        </span>
        <div>
          <p className="text-heading-md text-ink">Subscription confirmed</p>
          <p className="text-caption text-ink-mute">
            {formatMockUsdc(amount)} {MOCK_USDC.labelShort} subscribed on Stellar testnet.
          </p>
        </div>
      </div>
      <dl className="divide-y divide-hairline rounded-lg border border-hairline">
        <div className="flex items-center justify-between gap-md px-md py-sm">
          <dt className="text-caption text-ink-mute">Transaction</dt>
          <dd className="flex items-center gap-xs">
            <span className="mono text-[12px] text-ink">{truncate(result.hash, 8, 6)}</span>
            <a href={stellarExpertTx(result.hash)} target="_blank" rel="noreferrer" className="text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-md px-md py-sm">
          <dt className="text-caption text-ink-mute">Commitment</dt>
          <dd><HashChip value={result.commitment} /></dd>
        </div>
        <div className="flex items-center justify-between gap-md px-md py-sm">
          <dt className="text-caption text-ink-mute">Nullifier</dt>
          <dd><HashChip value={result.nullifier} /></dd>
        </div>
      </dl>
      <div className="flex gap-sm">
        <Button asChild variant="proof" className="flex-1">
          <a href={`/verify/${result.hash}`}>Verify this subscription</a>
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
