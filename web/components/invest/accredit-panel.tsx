"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Laptop, ArrowRight, Globe, Loader2, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HashChip } from "@/components/shared/copy";
import { Term } from "@/components/shared/term";
import {
  generateIdentity,
  requestSelfServeAccreditation,
  savePackage,
  type Identity,
} from "@/lib/accreditation";
import { computeLeaf } from "@/lib/zk/poseidon";
import { fieldToHex } from "@/lib/zk/field";
import { formatMockUsdc, truncate } from "@/lib/utils";
import { MOCK_USDC } from "@/lib/backend-config";
import { decodeError } from "@/lib/errors";
import type { ProofPackage } from "@/lib/zk/types";

type Phase = "idle" | "generating" | "verifying" | "sending" | "done";

/**
 * Shows, in real time, what stays on the device (investor_id, cap, secret) and
 * what leaves it (only the leaf hash). Converts the privacy promise from told to
 * shown. Uses the existing self-serve accreditation code path; presentational only.
 */
export function AccreditPanel({
  amountBaseUnits,
  onAccredited,
  poolId,
  poolContractId,
}: {
  amountBaseUnits: string;
  onAccredited: (pkg: ProofPackage) => void;
  poolId?: string;
  poolContractId?: string;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [identity, setIdentity] = React.useState<Identity | null>(null);
  const [leafHash, setLeafHash] = React.useState<string | null>(null);
  const [pkg, setPkg] = React.useState<ProofPackage | null>(null);

  const run = async () => {
    setPhase("generating");
    try {
      // 1 · generate identity locally and show it on the "device" side
      const id = generateIdentity();
      setIdentity(id);
      const leaf = await computeLeaf(id.investorId, id.cap, id.investorSecret);
      setLeafHash(fieldToHex(leaf));
      if (!reduce) await new Promise((r) => setTimeout(r, 650));

      // 2 · simulated issuer KYC/AML verification
      setPhase("verifying");
      if (!reduce) await new Promise((r) => setTimeout(r, 1800));

      // 3 · only the leaf hash crosses to the "network" side
      setPhase("sending");
      const result = await requestSelfServeAccreditation(id, amountBaseUnits, poolId, poolContractId);
      savePackage(result);
      setPkg(result);
      setPhase("done");
      toast.success("Accredited", { description: `Root committed at epoch ${result.epoch}` });
      onAccredited(result);
    } catch (e) {
      const f = decodeError(e);
      toast.error(f.title, { description: f.message });
      setPhase("idle");
    }
  };

  const showSplit = phase !== "idle";

  return (
    <div className="flex flex-col gap-lg">
      <div className="rounded-lg border border-hairline bg-canvas-soft p-lg">
        <div className="flex items-center gap-sm">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <p className="text-heading-sm text-ink">Request test accreditation</p>
        </div>
        <p className="mt-xs text-body-md text-ink-mute">
          We generate your <Term define="accreditation">accreditation</Term> details on this device, compute your{" "}
          <Term define="leaf">leaf</Term>, and send only the leaf hash to the issuer. Watch what stays and what leaves.
        </p>
        {phase === "idle" && (
          <Button className="mt-md" onClick={run}>
            <ShieldCheck className="h-4 w-4" /> Request test accreditation
          </Button>
        )}
      </div>

      {showSplit && (
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-sm">
          {/* device side */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-md">
            <p className="flex items-center gap-xs text-micro-cap uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              <Laptop className="h-3.5 w-3.5" /> Stays on your device
            </p>
            <dl className="mt-sm flex flex-col gap-xs text-caption">
              <Field k="investor_id" v={identity ? truncate(identity.investorId.toString(), 8, 4) : "…"} />
              <Field k="cap" v={identity ? `${formatMockUsdc(identity.cap)} ${MOCK_USDC.ticker}` : "…"} />
              <Field k="investor_secret" v={identity ? "•••• kept secret" : "…"} secret />
            </dl>
          </div>

          {/* crossing */}
          <div className="flex flex-col items-center justify-center px-xs">
            <motion.div
              initial={reduce ? false : { opacity: 0.3 }}
              animate={reduce ? undefined : { opacity: phase === "sending" || phase === "done" ? 1 : 0.3 }}
              className="flex flex-col items-center gap-xxs text-ink-mute"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="text-micro">leaf hash only</span>
            </motion.div>
          </div>

          {/* network side */}
          <div className="rounded-lg border border-accent-proof/30 bg-accent-proof/5 p-md">
            <p className="flex items-center gap-xs text-micro-cap uppercase tracking-wide text-accent-proof">
              <Globe className="h-3.5 w-3.5" /> Leaves your device
            </p>
            <div className="mt-sm">
              {phase === "generating" ? (
                <span className="text-caption text-ink-mute">nothing yet</span>
              ) : (
                <motion.div
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={reduce ? undefined : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-caption text-ink-mute">leaf</p>
                  {leafHash && <HashChip value={leafHash} />}
                </motion.div>
              )}
              {phase === "verifying" && (
                <motion.div
                  initial={reduce ? false : { opacity: 0 }}
                  animate={reduce ? undefined : { opacity: 1 }}
                  className="mt-sm rounded-md border border-amber-500/30 bg-amber-500/5 p-sm"
                >
                  <p className="flex items-center gap-xs text-caption text-amber-600 dark:text-amber-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Issuer verifying your eligibility...
                  </p>
                  <p className="mt-xxs text-micro text-ink-mute">
                    Simulated KYC/AML check. In production, the issuer performs real verification off-chain.
                  </p>
                </motion.div>
              )}
              {phase === "sending" && (
                <p className="mt-sm flex items-center gap-xs text-caption text-ink-mute">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> committing root on chain
                </p>
              )}
              {(phase === "sending" || phase === "done") && (
                <p className="mt-xs flex items-center gap-xs text-caption text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" /> Issuer confirmed eligibility
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {pkg && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-lg">
          <p className="flex items-center gap-xs text-caption text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" /> Accreditation committed. Your secret never left this device.
          </p>
          <dl className="mt-sm grid grid-cols-[auto_1fr] items-center gap-x-md gap-y-xs">
            <dt className="mono text-[12px] text-ink-mute">root</dt>
            <dd><HashChip value={pkg.root} /></dd>
            <dt className="mono text-[12px] text-ink-mute">epoch</dt>
            <dd className="tnum text-body-md text-ink">{pkg.epoch}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}

function Field({ k, v, secret }: { k: string; v: string; secret?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-sm">
      <dt className="mono text-[11px] text-ink-mute">{k}</dt>
      <dd className={secret ? "mono text-[11px] text-emerald-600 dark:text-emerald-400" : "mono text-[11px] text-ink"}>{v}</dd>
    </div>
  );
}
