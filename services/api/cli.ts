import { createDependencies } from "./config.js";
import { resolveListenOptions } from "./runtime.js";
import { buildServer } from "./server.js";

const server = buildServer(await createDependencies());
await server.listen(resolveListenOptions());
