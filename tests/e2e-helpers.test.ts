import { describe, expect, test, vi } from "vitest";

import {
  contractErrorCode,
  explorerLink,
  parseTokenAmount,
  recordEvidence,
  waitForRpcTransaction,
} from "../src/stellar/e2e.js";

describe("e2e transaction helpers", () => {
  test("parses token amounts at exactly seven decimals", () => {
    expect(parseTokenAmount("1.2345678")).toBe(12_345_678n);
    expect(parseTokenAmount("10000")).toBe(100_000_000_000n);
    expect(() => parseTokenAmount("0.00000001")).toThrow(/7 decimal/i);
  });

  test("decodes the stable NullifierUsed contract error", () => {
    expect(contractErrorCode("HostError: Error(Contract, #5) ContractError(5)")).toBe(5);
    expect(contractErrorCode("unrelated failure")).toBeUndefined();
  });

  test("forms the canonical testnet explorer URL", () => {
    expect(explorerLink("ab".repeat(32))).toBe(`https://stellar.expert/explorer/testnet/tx/${"ab".repeat(32)}`);
  });

  test("records finalized evidence without dropping existing entries", () => {
    expect(recordEvidence({ old: { hash: "old" } }, "subscribe", { hash: "new", ledger: 42, status: "SUCCESS" })).toEqual({
      old: { hash: "old" },
      subscribe: { hash: "new", ledger: 42, status: "SUCCESS", explorer: "https://stellar.expert/explorer/testnet/tx/new" },
    });
  });

  test("polls until RPC finality", async () => {
    const get = vi.fn().mockResolvedValueOnce({ status: "NOT_FOUND" }).mockResolvedValueOnce({ status: "SUCCESS", ledger: 99 });
    await expect(waitForRpcTransaction(get, "hash", { delayMs: 0, attempts: 2 })).resolves.toEqual({ status: "SUCCESS", ledger: 99 });
  });
});
