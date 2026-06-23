import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

import { Account, Transaction, TransactionBuilder } from "@stellar/stellar-sdk";

import { serializeProof, serializePublicSignals, type SnarkjsProof } from "../src/serialization/groth16.js";
import { contractErrorCode, explorerLink, recordEvidence, waitForRpcTransaction } from "../src/stellar/e2e.js";
import { writeRegistryAtomic } from "../src/stellar/deployments.js";
import { runStellar } from "../src/stellar/process.js";

const exec = promisify(execFile);
const AMOUNT = 25_000_000_000n;
const EXPECTED_ROOT = "24fbc2a0b5c37685faca4d084b90fcfaf681eead239b47cf6418e2868183f5d9";

interface Evidence {
  hash: string;
  ledger: number;
  status: "SUCCESS" | "FAILED";
  explorer?: string;
}

interface Registry {
  network: { rpcUrl: string; passphrase: string };
  accounts: Record<string, { publicKey: string }>;
  contracts: Record<string, { contractId: string; wasmHash: string }>;
  transactions: Record<string, Evidence>;
}

interface HorizonTransaction {
  hash: string;
  ledger: number;
  successful: boolean;
  envelope_xdr?: string;
}

async function horizonLatest(publicKey: string): Promise<HorizonTransaction | undefined> {
  const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}/transactions?order=desc&limit=1`);
  if (!response.ok) throw new Error(`Horizon latest transaction failed: ${response.status}`);
  const body = (await response.json()) as { _embedded: { records: HorizonTransaction[] } };
  return body._embedded.records[0];
}

async function horizonTransaction(hash: string): Promise<HorizonTransaction> {
  const response = await fetch(`https://horizon-testnet.stellar.org/transactions/${hash}`);
  if (!response.ok) throw new Error(`Horizon transaction ${hash} failed: ${response.status}`);
  return response.json() as Promise<HorizonTransaction>;
}

async function horizonSequence(publicKey: string): Promise<string> {
  const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
  if (!response.ok) throw new Error(`Horizon account lookup failed: ${response.status}`);
  return ((await response.json()) as { sequence: string }).sequence;
}

async function rpcTransaction(registry: Registry, hash: string): Promise<{ status?: string; ledger?: number }> {
  const response = await fetch(registry.network.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTransaction", params: { hash } }),
  });
  const body = (await response.json()) as { result?: { status?: string; ledger?: number } };
  return body.result ?? {};
}

async function waitForNewHorizon(publicKey: string, previousHash?: string): Promise<HorizonTransaction> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const current = await horizonLatest(publicKey);
    if (current && current.hash !== previousHash) return current;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for Horizon transaction from ${publicKey}`);
}

async function mutation(registry: Registry, key: string, source: string, args: string[]): Promise<string> {
  const publicKey = registry.accounts[source].publicKey;
  const before = await horizonLatest(publicKey);
  const result = await runStellar(args);
  const transaction = await waitForNewHorizon(publicKey, before?.hash);
  if (!transaction.successful) throw new Error(`${key} unexpectedly failed: ${transaction.hash}`);
  const finalized = await waitForRpcTransaction((hash) => rpcTransaction(registry, hash), transaction.hash);
  registry.transactions = recordEvidence(registry.transactions, key, {
    hash: transaction.hash,
    ledger: finalized.ledger,
    status: "SUCCESS",
  }) as Registry["transactions"];
  await writeRegistryAtomic("deployments.json", registry);
  return result.stdout.trim();
}

async function invokeView(contractId: string, source: string, fn: string, args: string[] = []): Promise<string> {
  const result = await runStellar(["contract", "invoke", "--id", contractId, "--source", source, "--network", "testnet", "--send", "no", "--", fn, ...args]);
  return result.stdout.trim();
}

async function balance(token: string, address: string): Promise<bigint> {
  const value = JSON.parse(await invokeView(token, "deployer", "balance", ["--id", address])) as string;
  return BigInt(value);
}

async function forceReplayTransaction(registry: Registry, successfulHash: string): Promise<Evidence> {
  const investor = registry.accounts["test-investor"].publicKey;
  const successful = await horizonTransaction(successfulHash);
  if (!successful.envelope_xdr) throw new Error("Successful subscription is missing envelope XDR");
  const original = TransactionBuilder.fromXDR(successful.envelope_xdr, registry.network.passphrase);
  if (!(original instanceof Transaction)) throw new Error("Subscription unexpectedly used a fee-bump envelope");
  const originalBody = original.toEnvelope().v1().tx();
  const sorobanData = originalBody.ext().value();
  if (!sorobanData) throw new Error("Subscription transaction is missing Soroban resource data");

  const replay = new TransactionBuilder(new Account(investor, await horizonSequence(investor)), {
    fee: "10000",
    networkPassphrase: registry.network.passphrase,
    sorobanData,
  })
    .addOperation(originalBody.operations()[0])
    .setTimeout(300)
    .build();
  const replayHash = replay.hash().toString("hex");
  const signed = await runStellar(["tx", "sign", "--sign-with-key", "test-investor", "--network", "testnet", replay.toXDR()]);
  try {
    await exec("stellar", ["tx", "send", "--network", "testnet", signed.stdout.trim()], { maxBuffer: 16 * 1024 * 1024 });
  } catch {
    // A finalized contract error makes the send command non-zero; RPC status below is authoritative.
  }
  const finalized = await waitForRpcTransaction((hash) => rpcTransaction(registry, hash), replayHash);
  if (finalized.status !== "FAILED") throw new Error(`Replay transaction unexpectedly finalized ${finalized.status}`);
  return { hash: replayHash, ledger: finalized.ledger, status: "FAILED", explorer: explorerLink(replayHash) };
}

async function main(): Promise<void> {
  const registry = JSON.parse(await readFile("deployments.json", "utf8")) as Registry;
  if (registry.transactions.e2eRootUpdate && registry.transactions.e2eSubscribe && registry.transactions.e2eReplay) {
    const expected = [
      [registry.transactions.e2eRootUpdate, "SUCCESS"],
      [registry.transactions.e2eSubscribe, "SUCCESS"],
      [registry.transactions.e2eReplay, "FAILED"],
    ] as const;
    for (const [evidence, status] of expected) {
      const finalized = await waitForRpcTransaction((hash) => rpcTransaction(registry, hash), evidence.hash);
      if (finalized.status !== status) throw new Error(`Recorded e2e transaction ${evidence.hash} is ${finalized.status}, expected ${status}`);
    }
    process.stdout.write(`E2E PASS (recorded evidence reverified)\nsubscribe=${registry.transactions.e2eSubscribe.hash}\nreplay=${registry.transactions.e2eReplay.hash} (FAILED, NullifierUsed)\n`);
    return;
  }
  const poolpass = registry.contracts.poolpass.contractId;
  const usdc = registry.contracts.mockUsdc.contractId;
  const poolToken = registry.contracts.poolToken.contractId;
  const issuer = registry.accounts["test-issuer"].publicKey;
  const investor = registry.accounts["test-investor"].publicKey;
  const tree = JSON.parse(await readFile("circuits/fixtures/tree.json", "utf8")) as { leaves: string[] };
  let info = JSON.parse(await invokeView(poolpass, "deployer", "get_pool_info")) as { epoch: number; merkle_root: string; total_subscribed: string };

  if (info.merkle_root === "0".repeat(64)) {
    const leaves = tree.leaves.map((leaf) => BigInt(leaf).toString(16).padStart(64, "0"));
    const root = JSON.parse(await mutation(registry, "e2eRootUpdate", "test-issuer", [
      "contract", "invoke", "--id", poolpass, "--source", "test-issuer", "--network", "testnet", "--send", "yes", "--",
      "update_accredited_set", "--issuer", issuer, "--leaf_hashes", JSON.stringify(leaves),
    ])) as string;
    if (root !== EXPECTED_ROOT) throw new Error(`On-chain root ${root} does not match ${EXPECTED_ROOT}`);
    info = JSON.parse(await invokeView(poolpass, "deployer", "get_pool_info")) as typeof info;
  }
  if (info.merkle_root !== EXPECTED_ROOT || info.epoch !== 1) {
    throw new Error(`Expected fixture root at epoch 1; received root=${info.merkle_root} epoch=${info.epoch}`);
  }

  const proof = JSON.parse(await readFile("circuits/proof.json", "utf8")) as SnarkjsProof;
  const publicSignals = JSON.parse(await readFile("circuits/public.json", "utf8")) as string[];
  const proofHex = serializeProof(proof).toString("hex");
  const publicHex = serializePublicSignals(publicSignals).map((value) => value.toString("hex"));
  const before = {
    investorUsdc: await balance(usdc, investor),
    escrowUsdc: await balance(usdc, poolpass),
    investorPool: await balance(poolToken, investor),
  };

  let subscribeEvidence = registry.transactions.e2eSubscribe;
  if (BigInt(info.total_subscribed) === 0n) {
    await mutation(registry, "e2eSubscribe", "test-investor", [
      "contract", "invoke", "--id", poolpass, "--source", "test-investor", "--network", "testnet", "--send", "yes", "--",
      "subscribe", "--investor", investor, "--amount", AMOUNT.toString(), "--proof", proofHex, "--public_inputs", JSON.stringify(publicHex),
    ]);
    subscribeEvidence = registry.transactions.e2eSubscribe;
  }
  if (!subscribeEvidence) throw new Error("Missing successful subscription evidence");

  const after = {
    investorUsdc: await balance(usdc, investor),
    escrowUsdc: await balance(usdc, poolpass),
    investorPool: await balance(poolToken, investor),
  };
  if (BigInt(info.total_subscribed) === 0n) {
    if (after.investorUsdc !== before.investorUsdc - AMOUNT) throw new Error("Investor USDC delta mismatch");
    if (after.escrowUsdc !== before.escrowUsdc + AMOUNT) throw new Error("Escrow USDC delta mismatch");
    if (after.investorPool !== before.investorPool + AMOUNT) throw new Error("Pool-token mint delta mismatch");
  }

  let replayMessage = "";
  try {
    await runStellar(["contract", "invoke", "--id", poolpass, "--source", "test-investor", "--network", "testnet", "--send", "yes", "--",
      "subscribe", "--investor", investor, "--amount", AMOUNT.toString(), "--proof", proofHex, "--public_inputs", JSON.stringify(publicHex)]);
    throw new Error("Replay unexpectedly simulated successfully");
  } catch (error) {
    replayMessage = `${(error as { stderr?: string }).stderr ?? ""}\n${String(error)}`;
  }
  if (contractErrorCode(replayMessage) !== 5) throw new Error(`Replay did not decode as NullifierUsed: ${replayMessage}`);

  if (!registry.transactions.e2eReplay) {
    registry.transactions.e2eReplay = await forceReplayTransaction(registry, subscribeEvidence.hash);
    await writeRegistryAtomic("deployments.json", registry);
  }
  const replay = registry.transactions.e2eReplay;
  const transcript = `# PoolPass testnet e2e transcript\n\n- Root update: ${registry.transactions.e2eRootUpdate?.hash} (${registry.transactions.e2eRootUpdate?.explorer})\n- Subscription: ${subscribeEvidence.hash} (${subscribeEvidence.explorer})\n- Replay: ${replay.hash}, finalized ${replay.status}, decoded ContractError(5) NullifierUsed (${replay.explorer})\n- Amount: ${AMOUNT} base units\n- Investor USDC after: ${after.investorUsdc}\n- Escrow USDC after: ${after.escrowUsdc}\n- Investor pool tokens after: ${after.investorPool}\n`;
  await writeFile("docs/e2e-transcript.md", transcript);
  process.stdout.write(`E2E PASS\nsubscribe=${subscribeEvidence.hash}\nreplay=${replay.hash} (${replay.status}, NullifierUsed)\n`);
}

await main();
