import { randomUUID } from "node:crypto";
import { rename, writeFile } from "node:fs/promises";

import type { StellarRunner } from "./identities.js";

const SECRET_KEY = /S[A-Z2-7]{55}/;

export interface ContractDeployment {
  contractId: string;
  wasmHash: string;
}

export function assertPublicRegistry(value: unknown): void {
  const serialized = JSON.stringify(value);
  if (SECRET_KEY.test(serialized)) throw new Error("Deployment registry must never contain a secret key");
}

export function shouldReuseContract(
  entry: ContractDeployment | undefined,
  expectedWasmHash: string,
  live: boolean,
): boolean {
  return Boolean(entry && live && entry.wasmHash.toLowerCase() === expectedWasmHash.toLowerCase());
}

export async function contractIsLive(runner: StellarRunner, contractId: string): Promise<boolean> {
  try {
    await runner(["contract", "info", "interface", "--id", contractId, "--network", "testnet"]);
    return true;
  } catch {
    return false;
  }
}

export async function writeRegistryAtomic(path: string, value: unknown): Promise<void> {
  assertPublicRegistry(value);
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, path);
}
