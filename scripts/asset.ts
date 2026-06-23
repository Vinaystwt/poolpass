import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const exec = promisify(execFile);
const [address, amount = "10000000000"] = process.argv.slice(2);
if (!address || !/^G[A-Z2-7]{55}$/.test(address)) throw new Error("Usage: pnpm faucet <G... address> [amount in 7-decimal units]");
if (BigInt(amount) <= 0n || BigInt(amount) > 100_000_000_000n) throw new Error("Faucet amount must be between 1 and 10000 USDC");
const deployments = JSON.parse(await readFile("deployments.json", "utf8")) as { contracts: { mockUsdc: { contractId: string } } };
const result = await exec("stellar", [
  "contract", "invoke", "--id", deployments.contracts.mockUsdc.contractId,
  "--source", "test-issuer", "--network", "testnet", "--send", "yes", "--",
  "mint", "--to", address, "--amount", amount,
]);
process.stdout.write(result.stdout);
