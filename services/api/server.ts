import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";

import { AccreditationService, type AccreditationChain } from "./accreditation.js";

const addressSchema = z.string().regex(/^G[A-Z2-7]{55}$/);
const fieldHexSchema = z.string().regex(/^[0-9a-f]{64}$/i);

export interface ApiDependencies {
  accreditationFile: string;
  accreditationChain: AccreditationChain;
  accreditationByPool?: Record<string, { file: string; chain: AccreditationChain }>;
  faucet: { mint(address: string, amount: string): Promise<object> };
  prover: { prove(input: unknown): Promise<object> };
  verifier: { verify(proof: unknown, publicSignals: string[]): Promise<boolean> };
  pool: { read(id: string): Promise<object>; list(): Promise<object[]> };
}

export function buildServer(dependencies: ApiDependencies): FastifyInstance {
  const server = Fastify({ logger: false, bodyLimit: 1_000_000 });
  const defaultAccreditation = new AccreditationService(dependencies.accreditationFile, dependencies.accreditationChain);
  // One accreditation service per pool so a leaf is committed to the chosen pool's tree.
  const accreditationByPool = new Map<string, AccreditationService>();
  for (const [poolId, cfg] of Object.entries(dependencies.accreditationByPool ?? {})) {
    accreditationByPool.set(poolId, new AccreditationService(cfg.file, cfg.chain));
  }
  const faucetClaims = new Set<string>();

  server.post("/accredit", async (request, reply) => {
    const parsed = z
      .object({ leaf: fieldHexSchema, poolId: z.string().min(1).optional() })
      .strict()
      .safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Expected a canonical 32-byte leaf hash and optional poolId" });
    const service =
      (parsed.data.poolId && accreditationByPool.get(parsed.data.poolId)) || defaultAccreditation;
    try {
      return await service.add(parsed.data.leaf.toLowerCase());
    } catch (error) {
      return reply.code(409).send({ error: String(error) });
    }
  });

  server.post("/faucet", async (request, reply) => {
    const parsed = z.object({ address: addressSchema, amount: z.string().regex(/^\d+$/).default("10000000000") }).strict().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid faucet request" });
    const amount = BigInt(parsed.data.amount);
    if (amount <= 0n || amount > 100_000_000_000n) return reply.code(400).send({ error: "Amount exceeds the 10,000 mock-USDC limit" });
    if (faucetClaims.has(parsed.data.address)) return reply.code(429).send({ error: "Faucet already claimed during this service window" });
    const result = await dependencies.faucet.mint(parsed.data.address, parsed.data.amount);
    faucetClaims.add(parsed.data.address);
    return result;
  });

  server.post("/prove", async (request, reply) => {
    const parsed = z.object({ input: z.record(z.string(), z.unknown()) }).strict().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid circuit input" });
    return dependencies.prover.prove(parsed.data.input);
  });

  server.post("/verify", async (request, reply) => {
    const parsed = z.object({ proof: z.record(z.string(), z.unknown()), publicSignals: z.array(z.string()).length(4) }).strict().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid proof payload" });
    return { valid: await dependencies.verifier.verify(parsed.data.proof, parsed.data.publicSignals) };
  });

  server.get<{ Params: { id: string } }>("/pool/:id", async (request) => dependencies.pool.read(request.params.id));
  server.get("/pools", async () => ({ pools: await dependencies.pool.list() }));
  return server;
}
