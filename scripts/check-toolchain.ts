import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);

export const expectedVersions = {
  stellar: "25.2.0",
  rustc: "1.94.1",
  cargo: "1.94.1",
  node: "24.14.0",
  pnpm: "10.33.0",
  circom: "2.2.2",
  snarkjs: "0.7.6",
} as const;

async function output(command: string, args: string[] = []): Promise<string> {
  const { stdout, stderr } = await exec(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PATH: `${process.cwd()}/.tools/bin:${process.cwd()}/node_modules/.bin:${process.env.PATH ?? ""}`,
    },
  });
  return `${stdout}${stderr}`;
}

function matchVersion(name: string, value: string, pattern: RegExp): string {
  const match = value.match(pattern);
  if (!match?.[1]) throw new Error(`Unable to parse ${name} version from: ${value.trim()}`);
  return match[1];
}

export async function readVersions(): Promise<Record<keyof typeof expectedVersions, string>> {
  const [stellar, rustc, cargo, node, pnpm, circom, snarkjsPackage] = await Promise.all([
    output("stellar", ["--version"]),
    output("rustc", ["--version"]),
    output("cargo", ["--version"]),
    output("node", ["--version"]),
    output("pnpm", ["--version"]),
    output("circom", ["--version"]),
    readFile(join(process.cwd(), "node_modules", "snarkjs", "package.json"), "utf8"),
  ]);

  return {
    stellar: matchVersion("stellar", stellar, /stellar\s+(\d+\.\d+\.\d+)/),
    rustc: matchVersion("rustc", rustc, /rustc\s+(\d+\.\d+\.\d+)/),
    cargo: matchVersion("cargo", cargo, /cargo\s+(\d+\.\d+\.\d+)/),
    node: matchVersion("node", node, /v(\d+\.\d+\.\d+)/),
    pnpm: matchVersion("pnpm", pnpm, /(\d+\.\d+\.\d+)/),
    circom: matchVersion("circom", circom, /circom compiler (\d+\.\d+\.\d+)/),
    snarkjs: String((JSON.parse(snarkjsPackage) as { version: string }).version),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const versions = await readVersions();
  for (const [name, expected] of Object.entries(expectedVersions)) {
    const actual = versions[name as keyof typeof versions];
    if (actual !== expected) throw new Error(`${name}: expected ${expected}, got ${actual}`);
  }
  process.stdout.write(`${JSON.stringify(versions, null, 2)}\n`);
}
