import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { serializeProof, serializePublicSignals, type SnarkjsProof } from "../src/serialization/groth16.js";
import { poseidon2, poseidon3 } from "../src/crypto/poseidon.js";
import { buildTreeFromLeaves, pathFor } from "../src/merkle/tree.js";
import { serializeVerificationKey, type SnarkjsVerificationKey } from "../src/serialization/groth16.js";
import { ensureIdentities } from "../src/stellar/identities.js";
import { writeRegistryAtomic } from "../src/stellar/deployments.js";
import { explorerLink, recordEvidence, waitForRpcTransaction } from "../src/stellar/e2e.js";
import { runStellar } from "../src/stellar/process.js";

const exec = promisify(execFile);
const REGISTRY_PATH = "deployments.json";
const NETWORK = "testnet";

const POOLS = [
  {
    id: "open-access",
    key: "openAccess",
    name: "Open Access Pool",
    issuerName: "poolpass-issuer-open",
    investorName: "poolpass-investor-open",
    cap: 100_000_000_000n,
    amount: 10_000_000_000n,
    gateDescription: "Depth-3 eligibility tree with two seeded investors and zero padding; demonstrates the base membership proof and a generous public cap.",
    records: [
      { investorId: 101n, secret: 1_101n },
      { investorId: 102n, secret: 1_102n },
    ],
  },
  {
    id: "capped-allocation",
    key: "cappedAllocation",
    name: "Capped Allocation Pool",
    issuerName: "poolpass-issuer-capped",
    investorName: "poolpass-investor-capped",
    cap: 25_000_000_000n,
    amount: 20_000_000_000n,
    gateDescription: "Depth-3 eligibility tree with a tighter public cap; demonstrates that an over-cap amount cannot produce a valid proof.",
    records: [
      { investorId: 201n, secret: 2_201n },
      { investorId: 202n, secret: 2_202n },
      { investorId: 203n, secret: 2_203n },
    ],
  },
  {
    id: "accredited-tier",
    key: "accreditedTier",
    name: "Accredited Tier Pool",
    issuerName: "poolpass-issuer-tier",
    investorName: "poolpass-investor-tier",
    cap: 250_000_000_000n,
    amount: 100_000_000_000n,
    gateDescription: "Depth-3 stricter-tier policy with all eight leaves seeded; Pool C uses option (b) because the verified circuit is compiled as PoolPass(3).",
    records: [
      { investorId: 301n, secret: 3_301n },
      { investorId: 302n, secret: 3_302n },
      { investorId: 303n, secret: 3_303n },
      { investorId: 304n, secret: 3_304n },
      { investorId: 305n, secret: 3_305n },
      { investorId: 306n, secret: 3_306n },
      { investorId: 307n, secret: 3_307n },
      { investorId: 308n, secret: 3_308n },
    ],
  },
] as const;

interface Evidence {
  hash: string;
  ledger: number;
  status: "SUCCESS" | "FAILED";
  explorer?: string;
}

interface Registry {
  network: { rpcUrl: string; passphrase: string; protocolVersion?: number };
  accounts: Record<string, { publicKey: string }>;
  contracts: Record<string, { contractId: string; wasmHash?: string }>;
  pools?: Array<{
    id: string;
    name: string;
    contractId: string;
    poolToken: string;
    merkleDepth: number;
    perInvestorCapPublic: string;
    issuer: string;
    vk: string;
    gateDescription: string;
  }>;
  transactions: Record<string, Evidence>;
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

async function rpcTransaction(registry: Registry, hash: string): Promise<{ status?: string; ledger?: number }> {
  const response = await fetch(registry.network.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTransaction", params: { hash } }),
  });
  const body = (await response.json()) as { result?: { status?: string; ledger?: number } };
  return body.result ?? {};
}

async function waitForNewTransaction(publicKey: string, previousHash: string | undefined): Promise<HorizonTransaction> {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const current = await latestTransaction(publicKey);
    if (current && current.hash !== previousHash) {
      if (!current.successful) throw new Error(`Transaction ${current.hash} failed`);
      return current;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for a transaction from ${publicKey}`);
}

async function mutation(registry: Registry, evidenceKey: string, sourceName: string, args: string[]): Promise<string> {
  const publicKey = registry.accounts[sourceName].publicKey;
  const before = await latestTransaction(publicKey);
  const result = await runStellar(args);
  const transaction = await waitForNewTransaction(publicKey, before?.hash);
  const finalized = await waitForRpcTransaction((hash) => rpcTransaction(registry, hash), transaction.hash);
  registry.transactions = recordEvidence(registry.transactions, evidenceKey, {
    hash: transaction.hash,
    ledger: finalized.ledger,
    status: "SUCCESS",
  }) as Registry["transactions"];
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

async function invoke(registry: Registry, evidenceKey: string, contractId: string, source: string, fn: string, args: string[]): Promise<string> {
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

async function deployContract(registry: Registry, evidenceKey: string, wasmPath: string): Promise<string> {
  const output = await mutation(registry, evidenceKey, "deployer", [
    "contract",
    "deploy",
    "--wasm",
    wasmPath,
    "--source",
    "deployer",
    "--network",
    NETWORK,
  ]);
  return contractId(output);
}

function hex32(value: bigint): string {
  return value.toString(16).padStart(64, "0");
}

async function proofFor(pool: (typeof POOLS)[number], root: bigint, epoch: number, amount: bigint) {
  const record = pool.records[0];
  const leaf = await poseidon3(record.investorId, pool.cap, record.secret);
  const leaves = await poolLeaves(pool);
  const tree = await buildTreeFromLeaves(leaves);
  if (tree.root !== root) throw new Error(`${pool.name} proof tree root mismatch`);
  const path = pathFor(tree, 0);
  const nullifier = await poseidon2(record.secret, BigInt(epoch));
  return withProofFiles(async (directory) => {
    const inputPath = join(directory, "input.json");
    const proofPath = join(directory, "proof.json");
    const publicPath = join(directory, "public.json");
    await writeFile(
      inputPath,
      JSON.stringify({
        merkle_root: root.toString(),
        amount: amount.toString(),
        nullifier: nullifier.toString(),
        epoch: epoch.toString(),
        investor_id: record.investorId.toString(),
        cap: pool.cap.toString(),
        investor_secret: record.secret.toString(),
        merkle_path: path.siblings.map(String),
        merkle_indices: path.indices.map(String),
      }),
    );
    await exec("pnpm", [
      "exec",
      "snarkjs",
      "groth16",
      "fullprove",
      inputPath,
      "circuits/build/poolpass/poolpass_js/poolpass.wasm",
      "circuits/build/poolpass/poolpass_final.zkey",
      proofPath,
      publicPath,
    ], { maxBuffer: 16 * 1024 * 1024 });
    const proof = JSON.parse(await readFile(proofPath, "utf8")) as SnarkjsProof;
    const publicSignals = JSON.parse(await readFile(publicPath, "utf8")) as string[];
    return {
      leaf,
      proofHex: serializeProof(proof).toString("hex"),
      publicHex: serializePublicSignals(publicSignals).map((value) => value.toString("hex")),
    };
  });
}

async function withProofFiles<T>(callback: (directory: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), "poolpass-marketplace-proof-"));
  try {
    return await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function poolLeaves(pool: (typeof POOLS)[number]): Promise<bigint[]> {
  const seeded = await Promise.all(pool.records.map((record) => poseidon3(record.investorId, pool.cap, record.secret)));
  return [...seeded, ...Array.from({ length: 8 - seeded.length }, () => 0n)];
}

async function ensureMockUsdc(registry: Registry, wasmPath: string, wasmHash: string): Promise<string> {
  const current = registry.contracts.mockUsdc?.contractId;
  if (current) return current;
  const mockUsdc = await deployContract(registry, "mockUsdcDeploy", wasmPath);
  registry.contracts.mockUsdc = { contractId: mockUsdc, wasmHash };
  await writeRegistryAtomic(REGISTRY_PATH, registry);
  await invoke(registry, "mockUsdcInitialize", mockUsdc, "test-issuer", "initialize", [
    "--admin",
    registry.accounts["test-issuer"].publicKey,
    "--decimals",
    "7",
    "--name",
    "Mock USDC",
    "--symbol",
    "mUSDC",
  ]);
  return mockUsdc;
}

async function balance(token: string, address: string): Promise<bigint> {
  const value = JSON.parse(await view(token, "deployer", "balance", ["--id", address])) as string | number;
  return BigInt(value);
}

async function main(): Promise<void> {
  await exec("stellar", ["contract", "build", "--package", "mock-token"], { maxBuffer: 16 * 1024 * 1024 });
  await exec("stellar", ["contract", "build", "--package", "poolpass"], { maxBuffer: 16 * 1024 * 1024 });

  const registry = JSON.parse(await readFile(REGISTRY_PATH, "utf8")) as Registry;
  const identityNames = [
    "deployer",
    "test-issuer",
    ...POOLS.flatMap((pool) => [pool.issuerName, pool.investorName]),
  ];
  const identities = await ensureIdentities(runStellar, identityNames);
  for (const { name, publicKey } of identities) registry.accounts[name] = { publicKey };
  await writeRegistryAtomic(REGISTRY_PATH, registry);

  const mockWasm = "target/wasm32v1-none/release/mock_token.wasm";
  const poolpassWasm = "target/wasm32v1-none/release/poolpass.wasm";
  const mockHash = await sha256(mockWasm);
  const poolpassHash = await sha256(poolpassWasm);
  const mockUsdc = await ensureMockUsdc(registry, mockWasm, mockHash);
  const vk = JSON.parse(await readFile("circuits/verification_key.json", "utf8")) as SnarkjsVerificationKey;
  const vkHex = serializeVerificationKey(vk).toString("hex");
  const deployedPools: Registry["pools"] = [];

  for (const pool of POOLS) {
    const poolToken = await deployContract(registry, `${pool.key}PoolTokenDeploy`, mockWasm);
    registry.contracts[`${pool.key}PoolToken`] = { contractId: poolToken, wasmHash: mockHash };
    await writeRegistryAtomic(REGISTRY_PATH, registry);
    await invoke(registry, `${pool.key}PoolTokenInitialize`, poolToken, "deployer", "initialize", [
      "--admin",
      registry.accounts.deployer.publicKey,
      "--decimals",
      "7",
      "--name",
      `${pool.name} Token`,
      "--symbol",
      `p${pool.id.slice(0, 4).toUpperCase()}`,
    ]);

    const poolpass = await deployContract(registry, `${pool.key}PoolpassDeploy`, poolpassWasm);
    registry.contracts[`${pool.key}Poolpass`] = { contractId: poolpass, wasmHash: poolpassHash };
    await writeRegistryAtomic(REGISTRY_PATH, registry);
    await invoke(registry, `${pool.key}PoolpassInitialize`, poolpass, pool.issuerName, "initialize", [
      "--issuer",
      registry.accounts[pool.issuerName].publicKey,
      "--usdc_sac",
      mockUsdc,
      "--pool_token",
      poolToken,
      "--groth16_vk",
      vkHex,
      "--merkle_depth",
      "3",
      "--pool_name",
      pool.name,
      "--per_investor_cap_public",
      pool.cap.toString(),
    ]);
    await invoke(registry, `${pool.key}PoolTokenSetAdmin`, poolToken, "deployer", "set_admin", [
      "--current_admin",
      registry.accounts.deployer.publicKey,
      "--new_admin",
      poolpass,
    ]);

    const leaves = await poolLeaves(pool);
    const root = (await buildTreeFromLeaves(leaves)).root;
    const onChainRoot = JSON.parse(await invoke(registry, `${pool.key}RootUpdate`, poolpass, pool.issuerName, "update_accredited_set", [
      "--issuer",
      registry.accounts[pool.issuerName].publicKey,
      "--leaf_hashes",
      JSON.stringify(leaves.map(hex32)),
    ])) as string;
    if (onChainRoot !== hex32(root)) throw new Error(`${pool.name} root mismatch ${onChainRoot} != ${hex32(root)}`);

    const investor = registry.accounts[pool.investorName].publicKey;
    const currentBalance = await balance(mockUsdc, investor);
    if (currentBalance < pool.amount) {
      await invoke(registry, `${pool.key}InvestorMint`, mockUsdc, "test-issuer", "mint", [
        "--to",
        investor,
        "--amount",
        (pool.amount - currentBalance).toString(),
      ]);
    }

    const info = JSON.parse(await view(poolpass, "deployer", "get_pool_info")) as {
      epoch: number;
      per_investor_cap_public: string | number | null;
    };
    if (String(info.per_investor_cap_public) !== pool.cap.toString()) {
      throw new Error(`${pool.name} cap not visible in PoolInfo: ${String(info.per_investor_cap_public)}`);
    }
    const proof = await proofFor(pool, root, info.epoch, pool.amount);
    await invoke(registry, `${pool.key}Subscribe`, poolpass, pool.investorName, "subscribe", [
      "--investor",
      investor,
      "--amount",
      pool.amount.toString(),
      "--proof",
      proof.proofHex,
      "--public_inputs",
      JSON.stringify(proof.publicHex),
    ]);

    deployedPools.push({
      id: pool.id,
      name: pool.name,
      contractId: poolpass,
      poolToken,
      merkleDepth: 3,
      perInvestorCapPublic: pool.cap.toString(),
      issuer: registry.accounts[pool.issuerName].publicKey,
      vk: "circuits/verification_key.json",
      gateDescription: pool.gateDescription,
    });
  }

  registry.pools = deployedPools;
  delete registry.contracts.poolpass;
  delete registry.contracts.poolToken;
  await writeRegistryAtomic(REGISTRY_PATH, registry);

  const capped = POOLS[1];
  try {
    await proofFor(capped, (await buildTreeFromLeaves(await poolLeaves(capped))).root, 1, capped.cap + 1n);
    throw new Error("Over-cap proof unexpectedly succeeded");
  } catch (error) {
    process.stdout.write(`overCapProofRejected: ${String(error).split("\n")[0]}\n`);
  }

  for (const pool of deployedPools) {
    process.stdout.write(`${pool.id}: ${pool.contractId} cap=${pool.perInvestorCapPublic}\n`);
  }
  process.stdout.write(`Marketplace deployment PASS\n`);
}

await main();
