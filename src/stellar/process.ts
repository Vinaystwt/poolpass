import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { CommandResult, StellarRunner } from "./identities.js";

const exec = promisify(execFile);

export const runStellar: StellarRunner = async (args): Promise<CommandResult> => {
  const { stdout, stderr } = await exec("stellar", args, {
    cwd: process.cwd(),
    maxBuffer: 16 * 1024 * 1024,
    env: process.env,
  });
  return { stdout, stderr };
};

