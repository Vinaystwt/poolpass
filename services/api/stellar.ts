import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  BASE_FEE,
  Contract,
  Keypair,
  rpc,
  scValToNative,
  Transaction,
  TransactionBuilder,
  type Account,
  type xdr,
} from "@stellar/stellar-sdk";

const exec = promisify(execFile);

interface SigningKeyOptions {
  env?: NodeJS.ProcessEnv;
  readKeystore?: (name: string) => Promise<string>;
}

export async function loadSigningKey(name: string, options: SigningKeyOptions = {}): Promise<Keypair> {
  const env = options.env ?? process.env;
  const variable = `STELLAR_SECRET_${name.replace(/-/g, "_").toUpperCase()}`;
  const readKeystore =
    options.readKeystore ??
    (async (identity: string) => {
      const result = await exec("stellar", ["keys", "secret", identity], {
        cwd: process.cwd(),
        env,
        maxBuffer: 1024 * 1024,
      });
      return result.stdout.trim();
    });
  const secret = env[variable] ?? (await readKeystore(name));
  try {
    return Keypair.fromSecret(secret);
  } catch {
    throw new Error(`No valid signing key is configured for ${name}`);
  }
}

interface ContractRpcServer {
  getAccount(address: string): Promise<Account>;
  simulateTransaction(transaction: Transaction): Promise<unknown>;
  sendTransaction(transaction: Transaction): Promise<{ status: string; hash: string; errorResult?: unknown }>;
  getTransaction(hash: string): Promise<{ status: string; returnValue?: xdr.ScVal; resultXdr?: { toXDR(format: "base64"): string } }>;
}

export interface ContractWriterDependencies {
  server: ContractRpcServer;
  networkPassphrase: string;
  loadKeypair: (name: string) => Promise<Keypair>;
  assembleTransaction: (
    transaction: Transaction,
    simulation: unknown,
  ) => { build(): Transaction };
  sleep: (milliseconds: number) => Promise<void>;
}

export interface ContractWrite {
  contractId: string;
  sourceName: string;
  method: string;
  args: xdr.ScVal[];
}

export interface ContractWriteResult {
  hash: string;
  status: "SUCCESS";
  returnValue?: unknown;
}

export function createContractWriter(dependencies: ContractWriterDependencies) {
  return {
    async invoke(write: ContractWrite): Promise<ContractWriteResult> {
      const signer = await dependencies.loadKeypair(write.sourceName);
      const account = await dependencies.server.getAccount(signer.publicKey());
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: dependencies.networkPassphrase,
      })
        .addOperation(new Contract(write.contractId).call(write.method, ...write.args))
        .setTimeout(180)
        .build();
      const simulation = await dependencies.server.simulateTransaction(transaction);
      const simulationResponse = simulation as rpc.Api.SimulateTransactionResponse;
      if (rpc.Api.isSimulationError(simulationResponse)) {
        throw new Error(`Transaction simulation failed: ${simulationResponse.error}`);
      }
      const prepared = dependencies.assembleTransaction(transaction, simulation).build();
      prepared.sign(signer);
      const sent = await dependencies.server.sendTransaction(prepared);
      if (sent.status === "ERROR") {
        throw new Error(`Transaction submission failed: ${String(sent.errorResult ?? "unknown RPC error")}`);
      }

      for (let attempt = 0; attempt < 40; attempt += 1) {
        const result = await dependencies.server.getTransaction(sent.hash);
        if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          return {
            hash: sent.hash,
            status: "SUCCESS",
            returnValue: result.returnValue ? scValToNative(result.returnValue) : undefined,
          };
        }
        if (result.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) {
          throw new Error(
            `Transaction ${sent.hash} finalized ${result.status}${
              result.resultXdr ? `: ${result.resultXdr.toXDR("base64")}` : ""
            }`,
          );
        }
        await dependencies.sleep(1_500);
      }
      throw new Error(`Timed out waiting for transaction ${sent.hash}`);
    },
  };
}

export function createTestnetContractWriter(rpcUrl: string, networkPassphrase: string) {
  const server = new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith("http://") });
  return createContractWriter({
    server,
    networkPassphrase,
    loadKeypair: loadSigningKey,
    assembleTransaction: (transaction, simulation) =>
      rpc.assembleTransaction(
        transaction,
        simulation as rpc.Api.SimulateTransactionSuccessResponse,
      ),
    sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  });
}
