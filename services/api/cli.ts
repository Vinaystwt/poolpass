import { createDependencies } from "./config.js";
import { buildServer } from "./server.js";

const server = buildServer(await createDependencies());
await server.listen({ host: process.env.HOST ?? "127.0.0.1", port: Number(process.env.PORT ?? 3000) });
