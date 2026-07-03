import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import { buildServer, type ApiDependencies } from "./server.js";

const address = "GCDJKMWI42NKQBYH4AC7RFKYS7A7YKJ3R7BHILOAEC2PF5VLE56BHHNK";
const servers: Array<ReturnType<typeof buildServer>> = [];

async function dependencies(now: () => number): Promise<ApiDependencies> {
  const directory = await mkdtemp(join(tmpdir(), "poolpass-faucet-"));
  return {
    accreditationFile: join(directory, "accreditation.json"),
    accreditationChain: {
      update: async (_leaves, root) => ({ root, epoch: 1 }),
    },
    faucet: {
      mint: vi.fn(async (_address, amount) => ({ minted: amount })),
    },
    prover: { prove: vi.fn(async () => ({})) },
    verifier: { verify: vi.fn(async () => true) },
    pool: {
      read: vi.fn(async () => ({})),
      list: vi.fn(async () => []),
    },
    now,
  };
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("faucet cooldown regression", () => {
  test("grants 10,000 Testnet USDC by default and allows another grant after 60 seconds", async () => {
    let now = Date.parse("2026-07-03T00:00:00Z");
    const deps = await dependencies(() => now);
    const server = buildServer(deps);
    servers.push(server);

    const first = await server.inject({
      method: "POST",
      url: "/faucet",
      payload: { address },
    });
    expect(first.statusCode).toBe(200);
    expect(deps.faucet.mint).toHaveBeenLastCalledWith(address, "100000000000");

    const blocked = await server.inject({
      method: "POST",
      url: "/faucet",
      payload: { address },
    });
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json()).toEqual({
      error: "faucet_cooldown",
      message: "You can request more test funds in 60 seconds",
      retryAfterSeconds: 60,
    });

    now += 60_000;
    const repeated = await server.inject({
      method: "POST",
      url: "/faucet",
      payload: { address },
    });
    expect(repeated.statusCode).toBe(200);
    expect(deps.faucet.mint).toHaveBeenCalledTimes(2);
  });
});
