import {
  Address,
  Keypair,
  nativeToScVal,
  Transaction,
} from "@stellar/stellar-sdk";
import { describe, expect, test, vi } from "vitest";

import { createContractReader } from "./stellar.js";

const PASSPHRASE = "Test SDF Network ; September 2015";
const CONTRACT = "CBVARDGOKLVCJ7ZAHETHH7GZIP35FQDQBTGK4J4PLLBXKRHU6SM7K2FV";

describe("SDK contract reader regression", () => {
  test("simulates a read-only contract call without a CLI process", async () => {
    const source = Keypair.random().publicKey();
    const simulateTransaction = vi.fn(async (_transaction: Transaction) => ({
      result: { retval: nativeToScVal("pool-info") },
    }));
    const reader = createContractReader({
      server: { simulateTransaction },
      networkPassphrase: PASSPHRASE,
      source,
    });

    const result = await reader.invoke(CONTRACT, "get_pool_info");

    expect(result).toBe("pool-info");
    expect(simulateTransaction).toHaveBeenCalledOnce();
    const transaction = simulateTransaction.mock.calls[0]![0];
    const operation = transaction.operations[0];
    if (operation.type !== "invokeHostFunction") throw new Error("Expected contract invocation");
    expect(operation.func.invokeContract().functionName().toString()).toBe("get_pool_info");
    expect(
      Address.fromScAddress(operation.func.invokeContract().contractAddress()).toString(),
    ).toBe(CONTRACT);
  });
});
