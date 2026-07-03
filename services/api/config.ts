import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { Address, nativeToScVal, xdr } from "@stellar/stellar-sdk";

import { runStellar } from "../../src/stellar/process.js";
import type { ApiDependencies } from "./server.js";
import { createTestnetContractWriter } from "./stellar.js";

const exec = promisify(execFile);

async function withProofFiles<T>(callback: (directory: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), "poolpass-proof-"));
  try {
    return await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

interface Deployments {
  network: {
    rpcUrl: string;
    passphrase: string;
  };
  accounts: Record<string, { publicKey: string }>;
  contracts: Record<string, { contractId: string }>;
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
}

interface IndexedEvent {
  name: string;
  poolId?: string;
  contractId: string;
  data?: { amount?: string };
}

interface PoolDescriptor {
  id: string;
  name: string;
  contractId: string;
  poolToken: string;
  merkleDepth: number;
  perInvestorCapPublic: string;
  issuer: string;
  vk: string;
  gateDescription: string;
}

async function invoke(id: string, source: string, send: "yes" | "no", fn: string, args: string[] = []): Promise<string> {
  const result = await runStellar(["contract", "invoke", "--id", id, "--source", source, "--network", "testnet", "--send", send, "--", fn, ...args]);
  return result.stdout.trim();
}

export async function createDependencies(): Promise<ApiDependencies> {
  const deployments = JSON.parse(await readFile("deployments.json", "utf8")) as Deployments;
  const writer = createTestnetContractWriter(
    deployments.network.rpcUrl,
    deployments.network.passphrase,
  );
  const pools: PoolDescriptor[] =
    deployments.pools ??
    [
      {
        id: "demo",
        name: "Demo Credit Pool",
        contractId: deployments.contracts.poolpass.contractId,
        poolToken: deployments.contracts.poolToken.contractId,
        merkleDepth: 3,
        perInvestorCapPublic: "",
        issuer: deployments.accounts["test-issuer"].publicKey,
        vk: "circuits/verification_key.json",
        gateDescription: "Legacy single PoolPass demo pool.",
      },
    ];
  const defaultPool = pools[0];
  const poolpass = defaultPool.contractId;
  const usdc = deployments.contracts.mockUsdc.contractId;
  const issuer = defaultPool.issuer;
  const issuerSource = Object.entries(deployments.accounts).find(([, account]) => account.publicKey === issuer)?.[0] ?? "test-issuer";
  const verificationKey = JSON.parse(await readFile("circuits/verification_key.json", "utf8")) as object;
  const readPoolInfo = async (pool: PoolDescriptor) =>
    JSON.parse(await invoke(pool.contractId, "deployer", "no", "get_pool_info")) as Record<string, unknown>;
  const readIndexedEvents = async (): Promise<IndexedEvent[]> => {
    try {
      const path = process.env.INDEXER_STORE ?? "services/data/events.json";
      const state = JSON.parse(await readFile(path, "utf8")) as { events?: IndexedEvent[] };
      return state.events ?? [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  };
  const statsFor = (pool: PoolDescriptor, events: IndexedEvent[]) => {
    const subscriptions = events.filter(
      (event) =>
        event.name === "subscribed" &&
        (event.poolId === pool.id || (!event.poolId && event.contractId === pool.contractId)),
    );
    const volume = subscriptions.reduce((sum, event) => sum + BigInt(event.data?.amount ?? "0"), 0n);
    return { subscriberCount: subscriptions.length, subscribedVolume: volume.toString() };
  };
  const presentPool = async (pool: PoolDescriptor) => {
    const [info, events] = await Promise.all([readPoolInfo(pool), readIndexedEvents()]);
    const stats = statsFor(pool, events);
    return {
      id: pool.id,
      name: pool.name,
      gateDescription: pool.gateDescription,
      contractId: pool.contractId,
      poolToken: pool.poolToken,
      issuer: pool.issuer,
      vk: pool.vk,
      merkleDepth: Number(info.merkle_depth ?? pool.merkleDepth),
      leafCount: 2 ** Number(info.merkle_depth ?? pool.merkleDepth),
      perInvestorCapPublic: String(info.per_investor_cap_public ?? pool.perInvestorCapPublic),
      totalSubscribed: String(info.total_subscribed ?? "0"),
      epoch: Number(info.epoch ?? 0),
      currentRoot: String(info.merkle_root ?? ""),
      subscriberCount: stats.subscriberCount,
      subscribedVolume: stats.subscribedVolume,
    };
  };
  // Each pool's issuer key lives in the local keystore under a predictable name.
  const issuerSourceByPool: Record<string, string> = {
    "open-access": "poolpass-issuer-open",
    "capped-allocation": "poolpass-issuer-capped",
    "accredited-tier": "poolpass-issuer-tier",
  };
  const chainFor = (pool: PoolDescriptor) => {
    const source = issuerSourceByPool[pool.id] ?? issuerSource;
    return {
      async update(leaves: string[], computedRoot: string) {
        const result = await writer.invoke({
          contractId: pool.contractId,
          sourceName: source,
          method: "update_accredited_set",
          args: [
            new Address(pool.issuer).toScVal(),
            xdr.ScVal.scvVec(
              leaves.map((leaf) => xdr.ScVal.scvBytes(Buffer.from(leaf, "hex"))),
            ),
          ],
        });
        const root =
          result.returnValue instanceof Uint8Array
            ? Buffer.from(result.returnValue).toString("hex")
            : String(result.returnValue ?? computedRoot);
        const info = JSON.parse(await invoke(pool.contractId, "deployer", "no", "get_pool_info")) as { epoch: number };
        return {
          root: root || computedRoot,
          epoch: info.epoch,
          hash: result.hash,
        };
      },
    };
  };
  const accreditationFileFor = (pool: PoolDescriptor) =>
    pool.id === defaultPool.id
      ? process.env.ACCREDITATION_STORE ?? "services/data/accreditation.json"
      : `services/data/accreditation-${pool.id}.json`;
  const accreditationByPool = Object.fromEntries(
    pools.map((pool) => [pool.id, { file: accreditationFileFor(pool), chain: chainFor(pool) }]),
  );

  return {
    accreditationFile: process.env.ACCREDITATION_STORE ?? "services/data/accreditation.json",
    accreditationChain: chainFor(defaultPool),
    accreditationByPool,
    faucet: {
      async mint(address, amount) {
        const result = await writer.invoke({
          contractId: usdc,
          sourceName: "test-issuer",
          method: "mint",
          args: [
            new Address(address).toScVal(),
            nativeToScVal(BigInt(amount), { type: "i128" }),
          ],
        });
        return { minted: amount, address, hash: result.hash, status: result.status };
      },
    },
    prover: {
      async prove(input) {
        return withProofFiles(async (directory) => {
          const inputPath = join(directory, "input.json");
          const proofPath = join(directory, "proof.json");
          const publicPath = join(directory, "public.json");
          await writeFile(inputPath, JSON.stringify(input));
          await exec("pnpm", ["exec", "snarkjs", "groth16", "fullprove", inputPath, "circuits/build/poolpass/poolpass_js/poolpass.wasm", "circuits/build/poolpass/poolpass_final.zkey", proofPath, publicPath], { maxBuffer: 16 * 1024 * 1024 });
          return { proof: JSON.parse(await readFile(proofPath, "utf8")), publicSignals: JSON.parse(await readFile(publicPath, "utf8")) };
        });
      },
    },
    verifier: {
      async verify(proof, publicSignals) {
        return withProofFiles(async (directory) => {
          const vkPath = join(directory, "vk.json");
          const proofPath = join(directory, "proof.json");
          const publicPath = join(directory, "public.json");
          await Promise.all([
            writeFile(vkPath, JSON.stringify(verificationKey)),
            writeFile(proofPath, JSON.stringify(proof)),
            writeFile(publicPath, JSON.stringify(publicSignals)),
          ]);
          const result = await exec("pnpm", ["exec", "snarkjs", "groth16", "verify", vkPath, publicPath, proofPath], { maxBuffer: 16 * 1024 * 1024 });
          return result.stdout.includes("OK!");
        });
      },
    },
    pool: {
      async read(id) {
        const pool = pools.find((candidate) => candidate.id === id || candidate.contractId === id || (id === "demo" && candidate === defaultPool));
        if (!pool) throw new Error("Unknown pool");
        return presentPool(pool);
      },
      async list() {
        return Promise.all(pools.map(presentPool));
      },
    },
  };
}
