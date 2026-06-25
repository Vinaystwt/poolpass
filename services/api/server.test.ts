import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import { verifyPath } from "../../src/merkle/tree.js";
import { buildServer, type ApiDependencies } from "./server.js";

const leafA = "249b7855f628bcee2a9fa38bdfbe315bac736dc66adf2b4930cb8dce208f5aeb";
const leafB = "11bff501cd171a8fd2fdf3665c9429858fc003f2d7db984ce1fd75361d95824f";
const address = "GCDJKMWI42NKQBYH4AC7RFKYS7A7YKJ3R7BHILOAEC2PF5VLE56BHHNK";
const servers: Array<ReturnType<typeof buildServer>> = [];

async function dependencies(): Promise<ApiDependencies> {
  const directory = await mkdtemp(join(tmpdir(), "poolpass-api-"));
  let epoch = 1;
  return {
    accreditationFile: join(directory, "accreditation.json"),
    accreditationChain: { update: async (_leaves, root) => ({ root, epoch: epoch++ }) },
    faucet: { mint: vi.fn(async () => ({ hash: "ab".repeat(32) })) },
    prover: { prove: vi.fn(async () => ({ proof: { ok: true }, publicSignals: ["1"] })) },
    verifier: { verify: vi.fn(async () => true) },
    pool: {
      read: vi.fn(async () => ({ id: "demo", epoch: 2, totalSubscribed: "25" })),
      list: vi.fn(async () => [
        { id: "open-access", name: "Open Access Pool", epoch: 1, totalSubscribed: "25" },
        { id: "capped-allocation", name: "Capped Allocation Pool", epoch: 1, totalSubscribed: "10" },
      ]),
    },
  };
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("PoolPass API", () => {
  test("accepts only a leaf and returns a path committed by the chain adapter", async () => {
    const server = buildServer(await dependencies());
    servers.push(server);
    const response = await server.inject({ method: "POST", url: "/accredit", payload: { leaf: leafA } });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({ leaf: leafA, index: 0, epoch: 1, merkle_indices: [0, 0, 0] });
    expect(await verifyPath(BigInt(`0x${leafA}`), {
      index: body.index,
      siblings: body.merkle_path.map(BigInt),
      indices: body.merkle_indices,
    })).toBe(BigInt(body.root));

    const leaked = await server.inject({ method: "POST", url: "/accredit", payload: { leaf: leafB, investor_secret: "nope" } });
    expect(leaked.statusCode).toBe(400);
  });

  test("serializes concurrent accredited-set updates", async () => {
    const deps = await dependencies();
    let active = 0;
    let maxActive = 0;
    deps.accreditationChain.update = async (_leaves, root) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active -= 1;
      return { root, epoch: 1 };
    };
    const server = buildServer(deps);
    servers.push(server);
    const [first, second] = await Promise.all([
      server.inject({ method: "POST", url: "/accredit", payload: { leaf: leafA } }),
      server.inject({ method: "POST", url: "/accredit", payload: { leaf: leafB } }),
    ]);
    expect([first.statusCode, second.statusCode]).toEqual([200, 200]);
    expect(maxActive).toBe(1);
  });

  test("validates and rate-limits faucet requests", async () => {
    const deps = await dependencies();
    const server = buildServer(deps);
    servers.push(server);
    expect((await server.inject({ method: "POST", url: "/faucet", payload: { address: "bad" } })).statusCode).toBe(400);
    expect((await server.inject({ method: "POST", url: "/faucet", payload: { address, amount: "10000000" } })).statusCode).toBe(200);
    expect((await server.inject({ method: "POST", url: "/faucet", payload: { address, amount: "10000000" } })).statusCode).toBe(429);
  });

  test("exposes bounded prove, fixed-key verify, and pool reads", async () => {
    const deps = await dependencies();
    const server = buildServer(deps);
    servers.push(server);
    expect((await server.inject({ method: "POST", url: "/prove", payload: { input: { amount: "1" } } })).json()).toEqual({ proof: { ok: true }, publicSignals: ["1"] });
    expect((await server.inject({ method: "POST", url: "/verify", payload: { proof: {}, publicSignals: ["1", "2", "3", "4"] } })).json()).toEqual({ valid: true });
    expect((await server.inject({ method: "GET", url: "/pool/demo" })).json()).toMatchObject({ id: "demo", epoch: 2 });
    expect((await server.inject({ method: "GET", url: "/pools" })).json()).toMatchObject({
      pools: [
        { id: "open-access", name: "Open Access Pool" },
        { id: "capped-allocation", name: "Capped Allocation Pool" },
      ],
    });
    expect(deps.verifier.verify).toHaveBeenCalledOnce();
  });
});
