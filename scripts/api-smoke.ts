import { readFile } from "node:fs/promises";

import { createDependencies } from "../services/api/config.js";
import { buildServer } from "../services/api/server.js";

const server = buildServer(await createDependencies());
try {
  const pools = await server.inject({ method: "GET", url: "/pools" });
  if (pools.statusCode !== 200 || !Array.isArray(pools.json().pools) || pools.json().pools.length === 0) {
    throw new Error(`Pools smoke failed: ${pools.body}`);
  }
  const pool = await server.inject({ method: "GET", url: `/pool/${pools.json().pools[0].id}` });
  if (pool.statusCode !== 200) throw new Error(`Live pool smoke failed: ${pool.body}`);
  const proof = JSON.parse(await readFile("circuits/proof.json", "utf8"));
  const publicSignals = JSON.parse(await readFile("circuits/public.json", "utf8"));
  const verified = await server.inject({ method: "POST", url: "/verify", payload: { proof, publicSignals } });
  if (verified.statusCode !== 200 || verified.json().valid !== true) throw new Error(`Verify smoke failed: ${verified.body}`);
  process.stdout.write("API smoke PASS\n");
} finally {
  await server.close();
}
