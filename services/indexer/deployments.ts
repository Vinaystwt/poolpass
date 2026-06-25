export interface EventPool {
  id: string;
  contractId: string;
}

export interface IndexerDeployments {
  contracts: { poolpass?: { contractId: string } };
  transactions: Record<string, { ledger?: number }>;
  pools?: EventPool[];
}

export function eventPoolsFromDeployments(deployments: IndexerDeployments): EventPool[] {
  if (deployments.pools?.length) {
    return deployments.pools.map((pool) => ({ id: pool.id, contractId: pool.contractId }));
  }
  const legacy = deployments.contracts.poolpass;
  return legacy ? [{ id: "demo", contractId: legacy.contractId }] : [];
}

export function indexerStartLedgerFromDeployments(deployments: IndexerDeployments): number {
  const poolKeys =
    deployments.pools?.map((pool) => `${pool.id.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())}PoolpassDeploy`) ??
    [];
  const poolDeployLedgers = Object.entries(deployments.transactions)
    .filter(([key]) => (poolKeys.length > 0 ? poolKeys.includes(key) : key.toLowerCase().endsWith("poolpassdeploy")))
    .map(([, value]) => value.ledger)
    .filter((ledger): ledger is number => typeof ledger === "number");
  if (poolDeployLedgers.length > 0) return Math.min(...poolDeployLedgers);
  const legacy = deployments.transactions.poolpassDeploy?.ledger;
  if (typeof legacy === "number") return legacy;
  return 0;
}
