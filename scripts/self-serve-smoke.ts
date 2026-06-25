import { readFile } from "node:fs/promises";

import { poseidon2, poseidon3 } from "../src/crypto/poseidon.js";
import { serializeProof, serializePublicSignals, type SnarkjsProof } from "../src/serialization/groth16.js";
import { explorerLink } from "../src/stellar/e2e.js";
import { writeRegistryAtomic } from "../src/stellar/deployments.js";
import { runStellar } from "../src/stellar/process.js";
import { createDependencies } from "../services/api/config.js";
import { buildServer } from "../services/api/server.js";

interface Registry {
  accounts: Record<string, { publicKey: string }>;
  contracts: Record<string, { contractId: string }>;
  pools?: Array<{ id: string; contractId: string; issuer: string }>;
  transactions: Record<string, { hash: string; ledger: number; status: "SUCCESS" | "FAILED"; explorer?: string }>;
}

interface HorizonTransaction {
  hash: string;
  ledger: number;
  successful: boolean;
}

async function latest(address: string): Promise<HorizonTransaction | undefined> {
  const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}/transactions?order=desc&limit=1`);
  const body = (await response.json()) as { _embedded: { records: HorizonTransaction[] } };
  return body._embedded.records[0];
}

async function next(address: string, previous?: string): Promise<HorizonTransaction> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const transaction = await latest(address);
    if (transaction && transaction.hash !== previous) return transaction;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for ${address}`);
}

function evidence(transaction: HorizonTransaction) {
  if (!transaction.successful) throw new Error(`Self-serve transaction ${transaction.hash} failed`);
  return { hash: transaction.hash, ledger: transaction.ledger, status: "SUCCESS" as const, explorer: explorerLink(transaction.hash) };
}

const registry = JSON.parse(await readFile("deployments.json", "utf8")) as Registry;
const activePool = registry.pools?.[0];
const poolpass = activePool?.contractId ?? registry.contracts.poolpass.contractId;
const activeKey = activePool?.id.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase()) ?? "";
const accreditKey = activeKey ? `selfServe${activeKey[0].toUpperCase()}${activeKey.slice(1)}Accredit` : "selfServeAccredit";
const faucetKey = activeKey ? `selfServe${activeKey[0].toUpperCase()}${activeKey.slice(1)}Faucet` : "selfServeFaucet";
const subscribeKey = activeKey ? `selfServe${activeKey[0].toUpperCase()}${activeKey.slice(1)}Subscribe` : "selfServeSubscribe";
if (registry.transactions[subscribeKey]) {
  process.stdout.write(`Self-serve smoke PASS (recorded) ${registry.transactions[subscribeKey].hash}\n`);
} else {
  const issuer = activePool?.issuer ?? registry.accounts["test-issuer"].publicKey;
  const tokenIssuer = registry.accounts["test-issuer"].publicKey;
  const visitor = registry.accounts.deployer.publicKey;
  const investorId = activePool ? 5_243n : 4_242n;
  const cap = 100_000_000_000n;
  const secret = activePool ? 9_102n : 9_001n;
  const amount = 10_000_000_000n;
  const leaf = (await poseidon3(investorId, cap, secret)).toString(16).padStart(64, "0");
  const server = buildServer(await createDependencies());
  try {
    const beforeAccredit = await latest(issuer);
    const accreditedResponse = await server.inject({ method: "POST", url: "/accredit", payload: { leaf } });
    if (accreditedResponse.statusCode !== 200) throw new Error(`Accreditation failed: ${accreditedResponse.body}`);
    registry.transactions[accreditKey] = evidence(await next(issuer, beforeAccredit?.hash));
    const accredited = accreditedResponse.json() as {
      root: string;
      epoch: number;
      merkle_path: string[];
      merkle_indices: number[];
    };

    const beforeFaucet = await latest(tokenIssuer);
    const faucet = await server.inject({ method: "POST", url: "/faucet", payload: { address: visitor, amount: amount.toString() } });
    if (faucet.statusCode !== 200) throw new Error(`Faucet failed: ${faucet.body}`);
    registry.transactions[faucetKey] = evidence(await next(tokenIssuer, beforeFaucet?.hash));

    const nullifier = await poseidon2(secret, BigInt(accredited.epoch));
    const proved = await server.inject({
      method: "POST",
      url: "/prove",
      payload: {
        input: {
          merkle_root: accredited.root,
          amount: amount.toString(),
          nullifier: nullifier.toString(),
          epoch: accredited.epoch.toString(),
          investor_id: investorId.toString(),
          cap: cap.toString(),
          investor_secret: secret.toString(),
          merkle_path: accredited.merkle_path,
          merkle_indices: accredited.merkle_indices.map(String),
        },
      },
    });
    if (proved.statusCode !== 200) throw new Error(`Fallback proving failed: ${proved.body}`);
    const payload = proved.json() as { proof: SnarkjsProof; publicSignals: string[] };
    const proofHex = serializeProof(payload.proof).toString("hex");
    const publicHex = serializePublicSignals(payload.publicSignals).map((value) => value.toString("hex"));
    const beforeSubscribe = await latest(visitor);
    await runStellar([
      "contract", "invoke", "--id", poolpass,
      "--source", "deployer", "--network", "testnet", "--send", "yes", "--",
      "subscribe", "--investor", visitor, "--amount", amount.toString(), "--proof", proofHex, "--public_inputs", JSON.stringify(publicHex),
    ]);
    registry.transactions[subscribeKey] = evidence(await next(visitor, beforeSubscribe?.hash));
    await writeRegistryAtomic("deployments.json", registry);
    process.stdout.write(`Self-serve smoke PASS ${registry.transactions[subscribeKey].hash}\n`);
  } finally {
    await server.close();
  }
}
