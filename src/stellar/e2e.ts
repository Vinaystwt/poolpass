export interface FinalTransaction {
  status: "SUCCESS" | "FAILED";
  ledger: number;
}

export function parseTokenAmount(value: string): bigint {
  const match = value.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) throw new TypeError(`Invalid token amount: ${value}`);
  const fraction = match[2] ?? "";
  if (fraction.length > 7) throw new RangeError("Token amount supports at most 7 decimal places");
  return BigInt(match[1]) * 10_000_000n + BigInt(fraction.padEnd(7, "0") || "0");
}

export function contractErrorCode(message: string): number | undefined {
  const match = message.match(/ContractError\((\d+)\)|Error\(Contract,\s*#(\d+)\)/);
  const code = match?.[1] ?? match?.[2];
  return code === undefined ? undefined : Number(code);
}

export function explorerLink(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export function recordEvidence<T extends Record<string, unknown>>(
  transactions: T,
  key: string,
  evidence: { hash: string; ledger: number; status: "SUCCESS" | "FAILED" },
): T & Record<string, unknown> {
  return {
    ...transactions,
    [key]: { ...evidence, explorer: explorerLink(evidence.hash) },
  };
}

export async function waitForRpcTransaction(
  get: (hash: string) => Promise<{ status?: string; ledger?: number }>,
  hash: string,
  options: { attempts?: number; delayMs?: number } = {},
): Promise<FinalTransaction> {
  const attempts = options.attempts ?? 30;
  const delayMs = options.delayMs ?? 1_000;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await get(hash);
    if ((result.status === "SUCCESS" || result.status === "FAILED") && result.ledger !== undefined) {
      return { status: result.status, ledger: result.ledger };
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`Transaction ${hash} did not finalize`);
}
