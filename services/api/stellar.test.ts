import {
  Account,
  Address,
  Keypair,
  scValToNative,
  Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { describe, expect, test, vi } from "vitest";

import {
  createContractWriter,
  loadSigningKey,
  type ContractWriterDependencies,
} from "./stellar.js";

const PASSPHRASE = "Test SDF Network ; September 2015";
const CONTRACT = "CBVARDGOKLVCJ7ZAHETHH7GZIP35FQDQBTGK4J4PLLBXKRHU6SM7K2FV";

describe("SDK contract writer", () => {
  test("loads a signing key from the hosted-runtime environment", async () => {
    const signer = Keypair.random();

    const loaded = await loadSigningKey("poolpass-issuer-open", {
      env: { STELLAR_SECRET_POOLPASS_ISSUER_OPEN: signer.secret() },
    });

    expect(loaded.publicKey()).toBe(signer.publicKey());
  });

  test("fails when the signing-key environment variable is missing", async () => {
    await expect(
      loadSigningKey("poolpass-issuer-open", {
        env: {},
      }),
    ).rejects.toThrow("STELLAR_SECRET_POOLPASS_ISSUER_OPEN");
  });

  test("builds, signs, submits, and polls a contract write through the SDK", async () => {
    const signer = Keypair.random();
    let submitted: Transaction | undefined;
    const server = {
      getAccount: vi.fn(async () => new Account(signer.publicKey(), "7")),
      simulateTransaction: vi.fn(async () => ({ transactionData: "simulated" })),
      sendTransaction: vi.fn(async (transaction: Transaction) => {
        submitted = transaction;
        return { status: "PENDING", hash: "ab".repeat(32) };
      }),
      getTransaction: vi.fn()
        .mockResolvedValueOnce({ status: "NOT_FOUND" })
        .mockResolvedValueOnce({
          status: "SUCCESS",
          returnValue: xdr.ScVal.scvI128(
            new xdr.Int128Parts({ hi: xdr.Int64.fromString("0"), lo: xdr.Uint64.fromString("9") }),
          ),
        }),
    };
    const dependencies: ContractWriterDependencies = {
      server,
      networkPassphrase: PASSPHRASE,
      loadKeypair: vi.fn(async () => signer),
      assembleTransaction: (transaction) => ({ build: () => transaction }),
      sleep: vi.fn(async () => undefined),
    };
    const writer = createContractWriter(dependencies);

    const result = await writer.invoke({
      contractId: CONTRACT,
      sourceName: "poolpass-issuer-open",
      method: "update_accredited_set",
      args: [
        new Address(signer.publicKey()).toScVal(),
        xdr.ScVal.scvVec(
          ["01".padStart(64, "0"), "02".padStart(64, "0")].map((leaf) =>
            xdr.ScVal.scvBytes(Buffer.from(leaf, "hex")),
          ),
        ),
      ],
    });

    expect(result).toMatchObject({ hash: "ab".repeat(32), status: "SUCCESS", returnValue: 9n });
    expect(server.simulateTransaction).toHaveBeenCalledOnce();
    expect(server.sendTransaction).toHaveBeenCalledOnce();
    expect(server.getTransaction).toHaveBeenCalledTimes(2);
    expect(submitted?.signatures.length).toBe(1);
    const operation = submitted!.operations[0];
    if (operation.type !== "invokeHostFunction") throw new Error("Expected invokeHostFunction operation");
    const invocation = operation.func.invokeContract();
    expect(invocation.functionName().toString()).toBe("update_accredited_set");
    const nativeArgs = invocation.args().map(scValToNative);
    expect(nativeArgs[0]).toBe(signer.publicKey());
    expect((nativeArgs[1] as Uint8Array[]).map((value) => Buffer.from(value).toString("hex"))).toEqual([
      "01".padStart(64, "0"),
      "02".padStart(64, "0"),
    ]);
  });
});
