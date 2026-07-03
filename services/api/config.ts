import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import {
  Address,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

import type { ApiDependencies } from "./server.js";
import {
  createTestnetContractReader,
  createTestnetContractWriter,
} from "./stellar.js";
import { resolveNetworkConfiguration } from "./runtime.js";
import {
  mergeLiveSubscriptions,
  type PoolStatEvent,
} from "./pool-stats.js";

const exec = promisify(execFile);
const snarkjs = join(process.cwd(), "node_modules", ".bin", "snarkjs");

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

export async function createDependencies(): Promise<ApiDependencies> {
  const deployments = JSON.parse(await readFile("deployments.json", "utf8")) as Deployments;
  const network = resolveNetworkConfiguration(deployments.network);
  const writer = createTestnetContractWriter(
    network.rpcUrl,
    network.passphrase,
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
  const usdc = deployments.contracts.mockUsdc.contractId;
  const issuer = defaultPool.issuer;
  const issuerSource = Object.entries(deployments.accounts).find(([, account]) => account.publicKey === issuer)?.[0] ?? "test-issuer";
  const verificationKey = JSON.parse(await readFile("circuits/verification_key.json", "utf8")) as object;
  const reader = createTestnetContractReader(
    network.rpcUrl,
    network.passphrase,
    deployments.accounts.deployer.publicKey,
  );
  const readPoolInfo = async (pool: PoolDescriptor) =>
    (await reader.invoke(pool.contractId, "get_pool_info")) as Record<string, unknown>;
  const eventServer = new rpc.Server(network.rpcUrl);
  const poolIdByContract = new Map(pools.map((pool) => [pool.contractId, pool.id]));
  const readSnapshotEvents = async (): Promise<PoolStatEvent[]> => {
    try {
      const path = process.env.INDEXER_STORE ?? "services/data/events.json";
      const state = JSON.parse(await readFile(path, "utf8")) as { events?: PoolStatEvent[] };
      return state.events ?? [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  };
  const readIndexedEvents = async (): Promise<PoolStatEvent[]> => {
    const snapshot = await readSnapshotEvents();
    try {
      const latest = await eventServer.getLatestLedger();
      const page = await eventServer.getEvents({
        startLedger: Math.max(1, latest.sequence - 10_000),
        filters: [
          {
            type: "contract",
            contractIds: pools.map((pool) => pool.contractId),
            topics: [
              [
                nativeToScVal("subscribed", { type: "symbol" }).toXDR("base64"),
                "*",
                "*",
              ],
            ],
          },
        ],
      });
      const live = page.events.map((event) => {
        const contractId = event.contractId?.toString() ?? "";
        const value = scValToNative(event.value) as { amount?: bigint | string | number };
        return {
          name: "subscribed",
          poolId: poolIdByContract.get(contractId),
          contractId,
          txHash: event.txHash,
          data: { amount: String(value.amount ?? "0") },
        } satisfies PoolStatEvent;
      });
      return mergeLiveSubscriptions(snapshot, live);
    } catch {
      return snapshot;
    }
  };
  const statsFor = (pool: PoolDescriptor, events: PoolStatEvent[]) => {
    const subscriptions = events.filter(
      (event) =>
        event.name === "subscribed" &&
        (event.poolId === pool.id || (!event.poolId && event.contractId === pool.contractId)),
    );
    const volume = subscriptions.reduce((sum, event) => sum + BigInt(event.data?.amount ?? "0"), 0n);
    return { subscriberCount: subscriptions.length, subscribedVolume: volume.toString() };
  };
  const presentPool = async (pool: PoolDescriptor, knownEvents?: PoolStatEvent[]) => {
    const [info, events] = await Promise.all([
      readPoolInfo(pool),
      knownEvents ? Promise.resolve(knownEvents) : readIndexedEvents(),
    ]);
    const stats = statsFor(pool, events);
    return {
      id: pool.id,
      name: String(info.pool_name ?? pool.name),
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
      currentRoot:
        info.merkle_root instanceof Uint8Array
          ? Buffer.from(info.merkle_root).toString("hex")
          : String(info.merkle_root ?? ""),
      subscriberCount: stats.subscriberCount,
      subscribedVolume: stats.subscribedVolume,
    };
  };
  // Each pool's issuer key is supplied through its predictable environment variable.
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
        const info = (await readPoolInfo(pool)) as { epoch: number };
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
          await exec(snarkjs, ["groth16", "fullprove", inputPath, "circuits/build/poolpass/poolpass_js/poolpass.wasm", "circuits/build/poolpass/poolpass_final.zkey", proofPath, publicPath], { maxBuffer: 16 * 1024 * 1024 });
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
          const result = await exec(snarkjs, ["groth16", "verify", vkPath, publicPath, proofPath], { maxBuffer: 16 * 1024 * 1024 });
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
        const events = await readIndexedEvents();
        return Promise.all(pools.map((pool) => presentPool(pool, events)));
      },
    },
  };
}
