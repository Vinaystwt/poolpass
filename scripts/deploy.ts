import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

import { serializeVerificationKey, type SnarkjsVerificationKey } from "../src/serialization/groth16.js";
import {
  contractIsLive,
  shouldReuseContract,
  writeRegistryAtomic,
  type ContractDeployment,
} from "../src/stellar/deployments.js";
import { runStellar } from "../src/stellar/process.js";

const exec = promisify(execFile);
const REGISTRY_PATH = "deployments.json";
const NETWORK = "testnet";
const EXPLORER = "https://stellar.expert/explorer/testnet/tx";

interface Registry {
  network: { rpcUrl: string };
  accounts: Record<string, { publicKey: string }>;
  contracts: Record<string, ContractDeployment>;
  transactions: Record<string, { hash: string; ledger: number; status: "SUCCESS"; explorer: string }>;
}

interface HorizonTransaction {
  hash: string;
  ledger: number;
  successful: boolean;
}

async function sha256(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function latestTransaction(publicKey: string): Promise<HorizonTransaction | undefined> {
  const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}/transactions?order=desc&limit=1`);
  if (!response.ok) throw new Error(`Horizon transaction lookup failed: ${response.status}`);
  const body = (await response.json()) as { _embedded: { records: HorizonTransaction[] } };
  return body._embedded.records[0];
}

async function waitForTransaction(publicKey: string, previousHash: string | undefined): Promise<HorizonTransaction> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const current = await latestTransaction(publicKey);
    if (current && current.hash !== previousHash) {
      if (!current.successful) throw new Error(`Transaction ${current.hash} failed`);
      return current;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for a transaction from ${publicKey}`);
}

async function mutation(
  registry: Registry,
  evidenceKey: string,
  sourceName: string,
  args: string[],
): Promise<string> {
  const publicKey = registry.accounts[sourceName].publicKey;
  const before = await latestTransaction(publicKey);
  const result = await runStellar(args);
  const transaction = await waitForTransaction(publicKey, before?.hash);
  registry.transactions[evidenceKey] = {
    hash: transaction.hash,
    ledger: transaction.ledger,
    status: "SUCCESS",
    explorer: `${EXPLORER}/${transaction.hash}`,
  };
  await writeRegistryAtomic(REGISTRY_PATH, registry);
  process.stdout.write(`${evidenceKey}: ${transaction.hash}\n`);
  return result.stdout.trim();
}

async function view(contractId: string, source: string, fn: string, args: string[] = []): Promise<string> {
  const result = await runStellar([
    "contract",
    "invoke",
    "--id",
    contractId,
    "--source",
    source,
    "--network",
    NETWORK,
    "--send",
    "no",
    "--",
    fn,
    ...args,
  ]);
  return result.stdout.trim();
}

async function invoke(
  registry: Registry,
  evidenceKey: string,
  contractId: string,
  source: string,
  fn: string,
  args: string[],
): Promise<string> {
  return mutation(registry, evidenceKey, source, [
    "contract",
    "invoke",
    "--id",
    contractId,
    "--source",
    source,
    "--network",
    NETWORK,
    "--send",
    "yes",
    "--",
    fn,
    ...args,
  ]);
}

function contractId(output: string): string {
  const match = output.match(/C[A-Z2-7]{55}/);
  if (!match) throw new Error(`Contract deployment did not return a contract ID: ${output}`);
  return match[0];
}

function jsonBigInt(output: string): bigint {
  const value = JSON.parse(output) as string | number;
  return BigInt(value);
}

async function ensureContract(
  registry: Registry,
  name: string,
  wasmPath: string,
  wasmHash: string,
): Promise<string> {
  const current = registry.contracts[name];
  const live = current ? await contractIsLive(runStellar, current.contractId) : false;
  if (shouldReuseContract(current, wasmHash, live)) {
    process.stdout.write(`${name}: reused ${current.contractId}\n`);
    return current.contractId;
  }
  const output = await mutation(registry, `${name}Deploy`, "deployer", [
    "contract",
    "deploy",
    "--wasm",
    wasmPath,
    "--source",
    "deployer",
    "--network",
    NETWORK,
  ]);
  const id = contractId(output);
  registry.contracts[name] = { contractId: id, wasmHash };
  await writeRegistryAtomic(REGISTRY_PATH, registry);
  return id;
}

async function main(): Promise<void> {
  await exec("stellar", ["contract", "build", "--package", "mock-token"], { maxBuffer: 16 * 1024 * 1024 });
  await exec("stellar", ["contract", "build", "--package", "poolpass"], { maxBuffer: 16 * 1024 * 1024 });

  const registry = JSON.parse(await readFile(REGISTRY_PATH, "utf8")) as Registry;
  const mockWasm = "target/wasm32v1-none/release/mock_token.wasm";
  const poolpassWasm = "target/wasm32v1-none/release/poolpass.wasm";
  const mockHash = await sha256(mockWasm);
  const poolpassHash = await sha256(poolpassWasm);

  const mockUsdc = await ensureContract(registry, "mockUsdc", mockWasm, mockHash);
  const poolToken = await ensureContract(registry, "poolToken", mockWasm, mockHash);
  const poolpass = await ensureContract(registry, "poolpass", poolpassWasm, poolpassHash);

  try {
    await view(mockUsdc, "deployer", "symbol");
  } catch {
    await invoke(registry, "mockUsdcInitialize", mockUsdc, "test-issuer", "initialize", [
      "--admin", registry.accounts["test-issuer"].publicKey,
      "--decimals", "7",
      "--name", "Mock USDC",
      "--symbol", "mUSDC",
    ]);
  }
  try {
    await view(poolToken, "deployer", "symbol");
  } catch {
    await invoke(registry, "poolTokenInitialize", poolToken, "deployer", "initialize", [
      "--admin", registry.accounts.deployer.publicKey,
      "--decimals", "7",
      "--name", "PoolPass Credit Pool Token",
      "--symbol", "pUSDC-Credit",
    ]);
  }

  try {
    await view(poolpass, "deployer", "get_pool_info");
  } catch {
    const vk = JSON.parse(await readFile("circuits/verification_key.json", "utf8")) as SnarkjsVerificationKey;
    await invoke(registry, "poolpassInitialize", poolpass, "test-issuer", "initialize", [
      "--issuer", registry.accounts["test-issuer"].publicKey,
      "--usdc_sac", mockUsdc,
      "--pool_token", poolToken,
      "--groth16_vk", serializeVerificationKey(vk).toString("hex"),
      "--merkle_depth", "3",
      "--pool_name", "Demo Credit Pool",
    ]);
  }

  const configuredAdmin = JSON.parse(await view(poolToken, "deployer", "admin")) as string;
  if (configuredAdmin !== poolpass) {
    await invoke(registry, "poolTokenSetAdmin", poolToken, "deployer", "set_admin", [
      "--current_admin", registry.accounts.deployer.publicKey,
      "--new_admin", poolpass,
    ]);
  }

  const investor = registry.accounts["test-investor"].publicKey;
  const balance = jsonBigInt(await view(mockUsdc, "deployer", "balance", ["--id", investor]));
  const target = 100_000_000_000n;
  if (balance < target) {
    await invoke(registry, "mockUsdcInitialMint", mockUsdc, "test-issuer", "mint", [
      "--to", investor,
      "--amount", (target - balance).toString(),
    ]);
  }

  for (const [name, id] of Object.entries({ mockUsdc, poolToken, poolpass })) {
    if (!(await contractIsLive(runStellar, id))) throw new Error(`${name} is not live after deployment`);
  }
  process.stdout.write(`PoolPass deployment PASS\nmockUsdc=${mockUsdc}\npoolToken=${poolToken}\npoolpass=${poolpass}\n`);
}

await main();
