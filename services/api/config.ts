import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { runStellar } from "../../src/stellar/process.js";
import type { ApiDependencies } from "./server.js";

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
  accounts: Record<string, { publicKey: string }>;
  contracts: Record<string, { contractId: string }>;
}

async function invoke(id: string, source: string, send: "yes" | "no", fn: string, args: string[] = []): Promise<string> {
  const result = await runStellar(["contract", "invoke", "--id", id, "--source", source, "--network", "testnet", "--send", send, "--", fn, ...args]);
  return result.stdout.trim();
}

export async function createDependencies(): Promise<ApiDependencies> {
  const deployments = JSON.parse(await readFile("deployments.json", "utf8")) as Deployments;
  const poolpass = deployments.contracts.poolpass.contractId;
  const usdc = deployments.contracts.mockUsdc.contractId;
  const issuer = deployments.accounts["test-issuer"].publicKey;
  const verificationKey = JSON.parse(await readFile("circuits/verification_key.json", "utf8")) as object;
  return {
    accreditationFile: process.env.ACCREDITATION_STORE ?? "services/data/accreditation.json",
    accreditationChain: {
      async update(leaves, computedRoot) {
        const root = JSON.parse(await invoke(poolpass, "test-issuer", "yes", "update_accredited_set", [
          "--issuer", issuer,
          "--leaf_hashes", JSON.stringify(leaves),
        ])) as string;
        const pool = JSON.parse(await invoke(poolpass, "deployer", "no", "get_pool_info")) as { epoch: number };
        return { root: root || computedRoot, epoch: pool.epoch };
      },
    },
    faucet: {
      async mint(address, amount) {
        const result = await invoke(usdc, "test-issuer", "yes", "mint", ["--to", address, "--amount", amount]);
        return { minted: amount, address, result };
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
        if (id !== "demo" && id !== poolpass) throw new Error("Unknown pool");
        return { id: "demo", contractId: poolpass, ...(JSON.parse(await invoke(poolpass, "deployer", "no", "get_pool_info")) as object) };
      },
    },
  };
}
