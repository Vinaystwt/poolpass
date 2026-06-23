import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

import {
  serializeProof,
  serializePublicSignals,
  serializeVerificationKey,
  type SnarkjsProof,
  type SnarkjsVerificationKey,
} from "../src/serialization/groth16.js";

const exec = promisify(execFile);
const BUILD = "circuits/build/gate-b";

interface Deployments {
  network: { rpcUrl: string };
  contracts: { gateGroth16: { contractId: string } };
  transactions: { gateBInvoke: { hash: string } };
}

async function main(): Promise<void> {
  const deployments = JSON.parse(await readFile("deployments.json", "utf8")) as Deployments;
  const proof = JSON.parse(await readFile(`${BUILD}/proof.json`, "utf8")) as SnarkjsProof;
  const vk = JSON.parse(await readFile(`${BUILD}/verification_key.json`, "utf8")) as SnarkjsVerificationKey;
  const publicSignals = JSON.parse(await readFile(`${BUILD}/public.json`, "utf8")) as string[];

  const verified = await exec(
    "snarkjs",
    ["groth16", "verify", `${BUILD}/verification_key.json`, `${BUILD}/public.json`, `${BUILD}/proof.json`],
    { env: { ...process.env, PATH: `${process.cwd()}/node_modules/.bin:${process.env.PATH ?? ""}` } },
  );
  if (!verified.stdout.includes("OK!")) throw new Error(`Off-chain verification failed: ${verified.stdout}`);

  const vkHex = serializeVerificationKey(vk).toString("hex");
  const proofHex = serializeProof(proof).toString("hex");
  const publicJson = JSON.stringify(serializePublicSignals(publicSignals).map((item) => item.toString("hex")));
  const invoked = await exec("stellar", [
    "contract",
    "invoke",
    "--id",
    deployments.contracts.gateGroth16.contractId,
    "--source",
    "deployer",
    "--network",
    "testnet",
    "--send",
    "no",
    "--",
    "verify",
    "--vk",
    vkHex,
    "--proof",
    proofHex,
    "--public_inputs",
    publicJson,
  ]);
  if (invoked.stdout.trim() !== "true") {
    throw new Error(`On-chain Gate B verification returned ${invoked.stdout.trim()}`);
  }

  const response = await fetch(deployments.network.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: { hash: deployments.transactions.gateBInvoke.hash },
    }),
  });
  const transaction = (await response.json()) as { result?: { status?: string } };
  if (transaction.result?.status !== "SUCCESS") {
    throw new Error(`Recorded Gate B transaction is ${String(transaction.result?.status)}`);
  }

  process.stdout.write("snarkjs=OK!\nonchain=true\nGate B PASS\n");
}

await main();

