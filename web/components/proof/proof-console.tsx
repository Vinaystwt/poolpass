"use client";

import * as React from "react";
import { Sparkles, ShieldAlert, ServerCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProofStages } from "./proof-stages";
import { ProofResult } from "./proof-result";
import { useProver, type ProveOutput } from "@/lib/hooks/use-prover";
import { assembleCircuitInput } from "@/lib/zk/assemble";
import { serializeProofHex, serializePublicSignalsHex } from "@/lib/zk/serialize";
import { proveBackend } from "@/lib/api";
import { decodeError } from "@/lib/errors";
import type { CircuitInput, ProofPackage } from "@/lib/zk/types";

export interface ProofConsoleHandle {
  output: ProveOutput | null;
  input: CircuitInput | null;
  usedFallback: boolean;
}

export function ProofConsole({
  pkg,
  amountBaseUnits,
  onResult,
  allowFallback = true,
}: {
  pkg: ProofPackage;
  amountBaseUnits: string;
  onResult?: (handle: ProofConsoleHandle) => void;
  allowFallback?: boolean;
}) {
  const { stage, busy, generate, verify, reset } = useProver();
  const [out, setOut] = React.useState<ProveOutput | null>(null);
  const [usedFallback, setUsedFallback] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmFallback, setConfirmFallback] = React.useState(false);

  const runInBrowser = async () => {
    setError(null);
    setOut(null);
    setUsedFallback(false);
    try {
      const circuitInput = await assembleCircuitInput(pkg, amountBaseUnits);
      const result = await generate(circuitInput);
      setOut(result);
      onResult?.({ output: result, input: circuitInput, usedFallback: false });
      if (!result.verified) toast.error("Proof failed local verification");
    } catch (e) {
      const f = decodeError(e);
      setError(f.message);
      toast.error(f.title, { description: f.message });
    }
  };

  const runFallback = async () => {
    setConfirmFallback(false);
    setError(null);
    setOut(null);
    try {
      const circuitInput = await assembleCircuitInput(pkg, amountBaseUnits);
      const t0 = performance.now();
      const { proof, publicSignals } = await proveBackend(circuitInput);
      const { valid, verifyMs } = await verify(proof, publicSignals);
      const proofHex = serializeProofHex(proof);
      const publicSignalsHex = serializePublicSignalsHex(publicSignals);
      const result: ProveOutput = {
        result: { proof, publicSignals },
        proofHex,
        publicSignalsHex,
        proofBytesLen: proofHex.length / 2,
        verified: valid,
        timings: { witnessMs: 0, proveMs: Math.round(performance.now() - t0 - verifyMs), verifyMs, totalMs: Math.round(performance.now() - t0) },
      };
      setOut(result);
      setUsedFallback(true);
      onResult?.({ output: result, input: circuitInput, usedFallback: true });
    } catch (e) {
      const f = decodeError(e);
      setError(f.message);
      toast.error(f.title, { description: f.message });
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      {!out && (
        <>
          {busy ? (
            <ProofStages stage={stage} />
          ) : (
            <div className="rounded-lg border border-accent-proof/30 bg-accent-proof/5 p-lg">
              <p className="text-body-md text-ink-secondary">
                Your <span className="mono text-[13px]">investor_id</span>,{" "}
                <span className="mono text-[13px]">cap</span>, and{" "}
                <span className="mono text-[13px]">investor_secret</span> stay on this device. Only a 256-byte proof
                and four public inputs leave it.
              </p>
            </div>
          )}

          <Button variant="proof" onClick={runInBrowser} disabled={busy}>
            <Sparkles className="h-4 w-4" /> {busy ? "Generating proof…" : "Generate proof in browser"}
          </Button>

          {allowFallback && !busy && (
            <div className="text-center">
              {confirmFallback ? (
                <div className="rounded-lg border border-ruby/30 bg-ruby/5 p-md text-left">
                  <p className="flex items-center gap-xs text-caption font-medium text-ruby">
                    <ShieldAlert className="h-4 w-4" /> This sends your private inputs to the server
                  </p>
                  <p className="mt-xs text-caption text-ink-mute">
                    The fallback <span className="mono text-[12px]">/prove</span> endpoint receives{" "}
                    <span className="mono text-[12px]">investor_id</span>,{" "}
                    <span className="mono text-[12px]">cap</span>, and{" "}
                    <span className="mono text-[12px]">investor_secret</span> in plaintext. This does not match the
                    privacy story. Use it only if in-browser proving will not run.
                  </p>
                  <div className="mt-md flex gap-sm">
                    <Button size="sm" variant="outline" onClick={() => setConfirmFallback(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="secondary" onClick={runFallback}>
                      <ServerCog className="h-4 w-4" /> I understand, use fallback
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmFallback(true)}
                  className="text-caption text-ink-mute underline decoration-dotted underline-offset-4 hover:text-ink"
                >
                  Use fallback prover (sends private inputs to the server)
                </button>
              )}
            </div>
          )}

          {error && <p className="text-caption text-ruby">{error}</p>}
        </>
      )}

      {out && (
        <>
          {usedFallback && (
            <div className="rounded-md border border-ruby/30 bg-ruby/5 px-md py-sm text-caption text-ruby">
              Generated via the server fallback, private inputs left your device.
            </div>
          )}
          <ProofResult out={out} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOut(null);
              reset();
            }}
          >
            Generate again
          </Button>
        </>
      )}
    </div>
  );
}
