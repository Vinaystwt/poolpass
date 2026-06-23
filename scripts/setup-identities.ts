import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { ensureIdentities } from "../src/stellar/identities.js";
import { runStellar } from "../src/stellar/process.js";

const DEPLOYMENTS_PATH = resolve("deployments.json");
const RPC_URL = "https://soroban-testnet.stellar.org";

interface Deployments {
  network: {
    name: string;
    rpcUrl: string;
    passphrase: string;
    protocolVersion: number;
  };
  accounts: Record<string, { publicKey: string }>;
  contracts: Record<string, unknown>;
  transactions: Record<string, unknown>;
}

async function protocolVersion(): Promise<number> {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getNetwork" }),
  });
  if (!response.ok) throw new Error(`getNetwork failed with HTTP ${response.status}`);
  const body = (await response.json()) as { result?: { protocolVersion?: number } };
  const value = body.result?.protocolVersion;
  if (!value || value < 25) throw new Error(`Testnet protocol ${String(value)} lacks required host functions`);
  return value;
}

async function assertFunded(publicKey: string): Promise<void> {
  const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
  if (!response.ok) throw new Error(`Friendbot funding not visible for ${publicKey}: HTTP ${response.status}`);
}

async function main(): Promise<void> {
  const identities = await ensureIdentities(runStellar, ["deployer", "test-issuer", "test-investor"]);
  await Promise.all(identities.map(({ publicKey }) => assertFunded(publicKey)));

  const deployments = JSON.parse(await readFile(DEPLOYMENTS_PATH, "utf8")) as Deployments;
  deployments.network.protocolVersion = await protocolVersion();
  for (const { name, publicKey } of identities) deployments.accounts[name] = { publicKey };

  const temporary = `${DEPLOYMENTS_PATH}.tmp`;
  await writeFile(temporary, `${JSON.stringify(deployments, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, DEPLOYMENTS_PATH);

  for (const { name, publicKey } of identities) process.stdout.write(`${name}: ${publicKey}\n`);
  process.stdout.write(`protocol: ${deployments.network.protocolVersion}\n`);
}

await main();
