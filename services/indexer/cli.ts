import { readFile } from "node:fs/promises";

import { type RpcContractEvent } from "./events.js";
import { PoolPassIndexer } from "./indexer.js";
import { EventStore } from "./store.js";

interface Deployments {
  network: { rpcUrl: string };
  contracts: { poolpass: { contractId: string } };
  transactions: { poolpassDeploy: { ledger: number } };
}

const deployments = JSON.parse(await readFile("deployments.json", "utf8")) as Deployments;
const fetchPage = async (startLedger: number): Promise<{ events: RpcContractEvent[]; latestLedger: number }> => {
  const latestResponse = await fetch(deployments.network.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestLedger" }),
  });
  const latestBody = (await latestResponse.json()) as { result?: { sequence?: number } };
  const currentLedger = latestBody.result?.sequence;
  if (currentLedger === undefined) throw new Error("getLatestLedger failed");
  if (startLedger > currentLedger) return { events: [], latestLedger: currentLedger };
  const response = await fetch(deployments.network.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getEvents",
      params: {
        startLedger,
        filters: [{ type: "contract", contractIds: [deployments.contracts.poolpass.contractId] }],
        pagination: { limit: 100 },
      },
    }),
  });
  const body = (await response.json()) as { result?: { events?: RpcContractEvent[]; latestLedger?: number }; error?: unknown };
  if (!body.result || body.result.latestLedger === undefined) throw new Error(`getEvents failed: ${JSON.stringify(body.error)}`);
  return { events: body.result.events ?? [], latestLedger: body.result.latestLedger };
};

const indexer = new PoolPassIndexer(
  new EventStore(process.env.INDEXER_STORE ?? "services/data/events.json"),
  fetchPage,
  deployments.transactions.poolpassDeploy.ledger,
);
const result = await indexer.runOnce();
process.stdout.write(`Indexer PASS cursor=${result.cursor} events=${result.events}\n`);
