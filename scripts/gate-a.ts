import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

import { poseidon2 } from "../src/crypto/poseidon.js";

const exec = promisify(execFile);
const EXPECTED =
  7853200120776062878684798364095072458815029376092732009249414926327459813530n;

interface Deployments {
  network: { rpcUrl: string };
  contracts: { gatePoseidon: { contractId: string } };
  transactions: { gateAInvoke: { hash: string } };
}

async function assertRecordedTransaction(rpcUrl: string, hash: string): Promise<void> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTransaction", params: { hash } }),
  });
  const body = (await response.json()) as { result?: { status?: string } };
  if (body.result?.status !== "SUCCESS") {
    throw new Error(`Recorded Gate A transaction ${hash} is ${String(body.result?.status)}`);
  }
}

async function main(): Promise<void> {
  const deployments = JSON.parse(await readFile("deployments.json", "utf8")) as Deployments;
  const witness = JSON.parse(await readFile("circuits/build/gate-a/witness.json", "utf8")) as string[];
  const offchain = await poseidon2(1n, 2n);
  const circuit = BigInt(witness[1]);

  const { stdout } = await exec(
    "stellar",
    [
      "contract",
      "invoke",
      "--id",
      deployments.contracts.gatePoseidon.contractId,
      "--source",
      "deployer",
      "--network",
      "testnet",
      "--send",
      "no",
      "--",
      "hash_two",
      "--left",
      "1",
      "--right",
      "2",
    ],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  const onchain = BigInt(JSON.parse(stdout.trim()) as string);

  if (offchain !== EXPECTED || circuit !== EXPECTED || onchain !== EXPECTED) {
    throw new Error(
      `Gate A mismatch: offchain=${offchain} circuit=${circuit} onchain=${onchain} expected=${EXPECTED}`,
    );
  }
  await assertRecordedTransaction(deployments.network.rpcUrl, deployments.transactions.gateAInvoke.hash);

  process.stdout.write(`offchain=${offchain}\ncircuit=${circuit}\nonchain=${onchain}\nGate A PASS\n`);
}

await main();

