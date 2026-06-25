import { describe, expect, test } from "vitest";

import { eventPoolsFromDeployments, indexerStartLedgerFromDeployments } from "./deployments.js";

describe("indexer deployment config", () => {
  test("reads multi-pool contracts and earliest pool deployment ledger", () => {
    const deployments = {
      contracts: {},
      transactions: {
        poolpassDeploy: { ledger: 50 },
        openAccessPoolpassDeploy: { ledger: 100 },
        cappedAllocationPoolpassDeploy: { ledger: 105 },
      },
      pools: [
        { id: "open-access", contractId: "CAAA" },
        { id: "capped-allocation", contractId: "CBBB" },
      ],
    };
    expect(eventPoolsFromDeployments(deployments)).toEqual([
      { id: "open-access", contractId: "CAAA" },
      { id: "capped-allocation", contractId: "CBBB" },
    ]);
    expect(indexerStartLedgerFromDeployments(deployments)).toBe(100);
  });

  test("keeps legacy single-pool deployments readable", () => {
    const deployments = {
      contracts: { poolpass: { contractId: "CLEGACY" } },
      transactions: { poolpassDeploy: { ledger: 90 } },
    };
    expect(eventPoolsFromDeployments(deployments)).toEqual([{ id: "demo", contractId: "CLEGACY" }]);
    expect(indexerStartLedgerFromDeployments(deployments)).toBe(90);
  });
});
