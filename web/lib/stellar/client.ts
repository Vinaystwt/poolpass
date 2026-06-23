"use client";

import { Buffer } from "buffer";
import {
  rpc,
  Account,
  Address,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { CONTRACTS, NETWORK, ACCOUNTS } from "../backend-config";
import { hexToBytes } from "../zk/field";

export const server = new rpc.Server(NETWORK.rpcUrl, { allowHttp: NETWORK.rpcUrl.startsWith("http://") });

export interface PoolInfo {
  epoch: number;
  issuer: string;
  merkle_depth: number;
  merkle_root: string; // hex
  per_investor_cap_public: bigint;
  pool_name: string;
  pool_token: string;
  total_subscribed: bigint;
  usdc_sac: string;
}

function bytesScVal(bytes: Uint8Array): xdr.ScVal {
  return xdr.ScVal.scvBytes(Buffer.from(bytes));
}

/** Simulate a read-only contract method and decode the result natively. */
async function simulateRead(method: string, args: xdr.ScVal[]): Promise<unknown> {
  const source = new Account(ACCOUNTS.deployer, "0");
  const contract = new Contract(CONTRACTS.poolpass);
  const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: NETWORK.passphrase })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  const retval = sim.result?.retval;
  if (!retval) throw new Error(`No return value from ${method}`);
  return scValToNative(retval);
}

function toHex(v: unknown): string {
  if (v instanceof Uint8Array) return Array.from(v, (b) => b.toString(16).padStart(2, "0")).join("");
  if (typeof v === "string") return v;
  return String(v);
}

export async function getPoolInfo(): Promise<PoolInfo> {
  const raw = (await simulateRead("get_pool_info", [])) as Record<string, unknown>;
  return {
    epoch: Number(raw.epoch),
    issuer: String(raw.issuer),
    merkle_depth: Number(raw.merkle_depth),
    merkle_root: toHex(raw.merkle_root),
    per_investor_cap_public: BigInt(raw.per_investor_cap_public as string | number | bigint),
    pool_name: String(raw.pool_name),
    pool_token: String(raw.pool_token),
    total_subscribed: BigInt(raw.total_subscribed as string | number | bigint),
    usdc_sac: String(raw.usdc_sac),
  };
}

/** Mock-USDC balance (base units) for an address. */
export async function getMockUsdcBalance(address: string): Promise<bigint> {
  const source = new Account(ACCOUNTS.deployer, "0");
  const contract = new Contract(CONTRACTS.mockUsdc);
  const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: NETWORK.passphrase })
    .addOperation(contract.call("balance", new Address(address).toScVal()))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  return BigInt(scValToNative(sim.result!.retval) as string | number | bigint);
}

export interface SubmitResult {
  hash: string;
  status: string;
  returnValue?: unknown;
}

/**
 * Build → simulate → sign (via Freighter) → submit → poll a contract invocation.
 * `sign` is injected so this stays decoupled from the wallet store.
 */
async function invoke(
  source: string,
  method: string,
  args: xdr.ScVal[],
  contractId: string,
  sign: (xdr: string) => Promise<string>,
): Promise<SubmitResult> {
  const account = await server.getAccount(source);
  const contract = new Contract(contractId);
  const built = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK.passphrase })
    .addOperation(contract.call(method, ...args))
    .setTimeout(180)
    .build();

  const sim = await server.simulateTransaction(built);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);

  const prepared = rpc.assembleTransaction(built, sim).build();
  const signedXdr = await sign(prepared.toXDR());
  const signed = TransactionBuilder.fromXDR(signedXdr, NETWORK.passphrase);

  const sent = await server.sendTransaction(signed);
  if (sent.status === "ERROR") {
    throw new Error(`Submission failed: ${JSON.stringify(sent.errorResult ?? sent)}`);
  }

  // Poll until the ledger closes the transaction.
  let attempts = 0;
  while (attempts < 30) {
    const res = await server.getTransaction(sent.hash);
    if (res.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) {
      if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return {
          hash: sent.hash,
          status: "SUCCESS",
          returnValue: res.returnValue ? scValToNative(res.returnValue) : undefined,
        };
      }
      throw new Error(
        `Transaction ${sent.hash} finalized FAILED. ${
          res.resultXdr ? res.resultXdr.toXDR("base64") : ""
        }`,
      );
    }
    await new Promise((r) => setTimeout(r, 1500));
    attempts += 1;
  }
  throw new Error(`Timed out waiting for ${sent.hash}`);
}

// ── PoolPass write methods ───────────────────────────────────────────────────

export async function subscribe(params: {
  investor: string;
  amount: bigint;
  proofHex: string;
  publicSignalsHex: string[];
  sign: (xdr: string) => Promise<string>;
}): Promise<SubmitResult> {
  const { investor, amount, proofHex, publicSignalsHex, sign } = params;
  const proofScVal = bytesScVal(hexToBytes(proofHex));
  const publicInputs = xdr.ScVal.scvVec(publicSignalsHex.map((h) => bytesScVal(hexToBytes(h))));
  const args = [
    new Address(investor).toScVal(),
    nativeToScVal(amount, { type: "i128" }),
    proofScVal,
    publicInputs,
  ];
  return invoke(investor, "subscribe", args, CONTRACTS.poolpass, sign);
}

export async function updateAccreditedSet(params: {
  issuer: string;
  leafHashesHex: string[];
  sign: (xdr: string) => Promise<string>;
}): Promise<SubmitResult> {
  const { issuer, leafHashesHex, sign } = params;
  const leaves = xdr.ScVal.scvVec(leafHashesHex.map((h) => bytesScVal(hexToBytes(h))));
  const args = [new Address(issuer).toScVal(), leaves];
  return invoke(issuer, "update_accredited_set", args, CONTRACTS.poolpass, sign);
}

export async function advanceEpoch(params: {
  issuer: string;
  sign: (xdr: string) => Promise<string>;
}): Promise<SubmitResult> {
  const args = [new Address(params.issuer).toScVal()];
  return invoke(params.issuer, "advance_epoch", args, CONTRACTS.poolpass, params.sign);
}
