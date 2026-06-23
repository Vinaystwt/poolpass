/// <reference lib="webworker" />
// In-browser Groth16 prover. Runs in a Web Worker so the UI thread stays free.
// Three genuine stages, each separately timed:
//   1. witness  — snarkjs.wtns.calculate against the committed .wasm
//   2. prove    — snarkjs.groth16.prove against the committed .zkey
//   3. verify   — snarkjs.groth16.verify against the committed VK (local check)
import * as snarkjs from "snarkjs";
import { serializeProofHex, serializePublicSignalsHex } from "./serialize";
import type { WorkerRequest, WorkerResponse } from "./types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(msg: WorkerResponse) {
  ctx.postMessage(msg);
}

ctx.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  const { id } = req;
  try {
    // Verify-only path (used by /verify pages) — no proving, just the pairing check.
    if (req.mode === "verify") {
      const v0 = performance.now();
      const vk = await (await fetch(req.vkUrl)).json();
      const valid: boolean = await snarkjs.groth16.verify(vk, req.publicSignals, req.proof);
      post({ id, type: "verified", valid, verifyMs: Math.round(performance.now() - v0) });
      return;
    }

    const { input, wasmUrl, zkeyUrl, vkUrl } = req;
    const t0 = performance.now();

    // Stage 1 — witness
    post({ id, type: "stage", stage: "witness" });
    const wtns: { type: "mem"; data?: Uint8Array } = { type: "mem" };
    await snarkjs.wtns.calculate(input as unknown as Record<string, unknown>, wasmUrl, wtns);
    const t1 = performance.now();

    // Stage 2 — prove
    post({ id, type: "stage", stage: "prove" });
    const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyUrl, wtns);
    const t2 = performance.now();

    // Stage 3 — verify locally
    post({ id, type: "stage", stage: "verify" });
    const vk = await (await fetch(vkUrl)).json();
    const verified: boolean = await snarkjs.groth16.verify(vk, publicSignals, proof);
    const t3 = performance.now();

    const proofHex = serializeProofHex(proof);
    const publicSignalsHex = serializePublicSignalsHex(publicSignals);

    post({
      id,
      type: "result",
      result: { proof, publicSignals },
      proofHex,
      publicSignalsHex,
      proofBytesLen: proofHex.length / 2,
      verified,
      timings: {
        witnessMs: Math.round(t1 - t0),
        proveMs: Math.round(t2 - t1),
        verifyMs: Math.round(t3 - t2),
        totalMs: Math.round(t3 - t0),
      },
    });
    post({ id, type: "stage", stage: "done" });
  } catch (err) {
    post({ id, type: "error", message: err instanceof Error ? err.message : String(err) });
    post({ id, type: "stage", stage: "error" });
  }
});

export {};
