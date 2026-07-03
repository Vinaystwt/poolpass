import { describe, expect, test } from "vitest";

import { mergeLiveSubscriptions } from "./pool-stats.js";

describe("live pool statistics regression", () => {
  test("adds recent RPC subscriptions that are not yet in the disk snapshot", () => {
    const merged = mergeLiveSubscriptions(
      [
        {
          name: "subscribed",
          poolId: "open-access",
          contractId: "contract-a",
          txHash: "old",
          data: { amount: "10000000000" },
        },
      ],
      [
        {
          name: "subscribed",
          poolId: "open-access",
          contractId: "contract-a",
          txHash: "new",
          data: { amount: "25000000000" },
        },
      ],
    );

    expect(merged.map((event) => event.txHash)).toEqual(["old", "new"]);
    expect(merged.reduce((sum, event) => sum + BigInt(event.data?.amount ?? "0"), 0n)).toBe(
      35_000_000_000n,
    );
  });
});
