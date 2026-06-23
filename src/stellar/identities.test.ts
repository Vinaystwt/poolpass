import { describe, expect, test } from "vitest";
import {
  ensureIdentities,
  publicIdentity,
  type CommandResult,
  type StellarRunner,
} from "./identities.js";

describe("testnet identities", () => {
  test("never includes a secret key in public metadata", () => {
    expect(
      publicIdentity({
        publicKey: `G${"A".repeat(55)}`,
        secretKey: `S${"B".repeat(55)}`,
      }),
    ).toEqual({ publicKey: `G${"A".repeat(55)}` });
  });

  test("creates only identities missing from the CLI keystore", async () => {
    const calls: string[][] = [];
    const generated = new Set<string>();
    const runner: StellarRunner = async (args): Promise<CommandResult> => {
      calls.push(args);
      const name = args[2];
      if (args[0] === "keys" && args[1] === "address") {
        if (name === "deployer") return { stdout: `G${"D".repeat(55)}\n`, stderr: "" };
        if (generated.has(name)) return { stdout: `G${"A".repeat(55)}\n`, stderr: "" };
        throw new Error("identity not found");
      }
      if (args[0] === "keys" && args[1] === "generate") {
        generated.add(name);
        return { stdout: "", stderr: "" };
      }
      throw new Error(`unexpected command: ${args.join(" ")}`);
    };

    const identities = await ensureIdentities(runner, ["deployer", "test-issuer", "test-investor"]);

    expect(calls.filter((call) => call[1] === "generate")).toHaveLength(2);
    expect(identities.map(({ name }) => name)).toEqual(["deployer", "test-issuer", "test-investor"]);
    expect(JSON.stringify(identities)).not.toMatch(/S[A-Z2-7]{55}/);
  });

  test("rejects command output that contains a Stellar secret", async () => {
    const runner: StellarRunner = async () => ({
      stdout: `S${"A".repeat(55)}`,
      stderr: "",
    });
    await expect(ensureIdentities(runner, ["deployer"])).rejects.toThrow(/secret/i);
  });
});
