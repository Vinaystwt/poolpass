"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZK_ARTIFACTS } from "../backend-config";
import type {
  CircuitInput,
  ProofStage,
  SnarkProofResult,
  WorkerResponse,
} from "../zk/types";

export interface ProveTimings {
  witnessMs: number;
  proveMs: number;
  verifyMs: number;
  totalMs: number;
}

export interface ProveOutput {
  result: SnarkProofResult;
  proofHex: string;
  publicSignalsHex: string[];
  proofBytesLen: number;
  verified: boolean;
  timings: ProveTimings;
}

let requestCounter = 0;

export function useProver() {
  const workerRef = useRef<Worker | null>(null);
  const [stage, setStage] = useState<ProofStage>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Module worker, bundled by webpack via import.meta.url.
    const worker = new Worker(new URL("../zk/prover.worker.ts", import.meta.url));
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const generate = useCallback((input: CircuitInput): Promise<ProveOutput> => {
    const worker = workerRef.current;
    if (!worker) return Promise.reject(new Error("Prover not ready"));
    const id = ++requestCounter;
    setBusy(true);
    setError(null);
    setStage("witness");
    return new Promise<ProveOutput>((resolve, reject) => {
      const onMessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;
        if (msg.id !== id) return;
        if (msg.type === "stage") {
          setStage(msg.stage);
        } else if (msg.type === "result") {
          worker.removeEventListener("message", onMessage);
          setBusy(false);
          resolve({
            result: msg.result,
            proofHex: msg.proofHex,
            publicSignalsHex: msg.publicSignalsHex,
            proofBytesLen: msg.proofBytesLen,
            verified: msg.verified,
            timings: msg.timings,
          });
        } else if (msg.type === "error") {
          worker.removeEventListener("message", onMessage);
          setBusy(false);
          setStage("error");
          setError(msg.message);
          reject(new Error(msg.message));
        }
      };
      worker.addEventListener("message", onMessage);
      worker.postMessage({
        id,
        mode: "prove",
        input,
        wasmUrl: ZK_ARTIFACTS.wasm,
        zkeyUrl: ZK_ARTIFACTS.zkey,
        vkUrl: ZK_ARTIFACTS.verificationKey,
      });
    });
  }, []);

  const verify = useCallback(
    (proof: SnarkProofResult["proof"], publicSignals: string[]): Promise<{ valid: boolean; verifyMs: number }> => {
      const worker = workerRef.current;
      if (!worker) return Promise.reject(new Error("Verifier not ready"));
      const id = ++requestCounter;
      return new Promise((resolve, reject) => {
        const onMessage = (e: MessageEvent<WorkerResponse>) => {
          const msg = e.data;
          if (msg.id !== id) return;
          if (msg.type === "verified") {
            worker.removeEventListener("message", onMessage);
            resolve({ valid: msg.valid, verifyMs: msg.verifyMs });
          } else if (msg.type === "error") {
            worker.removeEventListener("message", onMessage);
            reject(new Error(msg.message));
          }
        };
        worker.addEventListener("message", onMessage);
        worker.postMessage({ id, mode: "verify", vkUrl: ZK_ARTIFACTS.verificationKey, proof, publicSignals });
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setStage("idle");
    setError(null);
    setBusy(false);
  }, []);

  return { stage, busy, error, generate, verify, reset };
}
