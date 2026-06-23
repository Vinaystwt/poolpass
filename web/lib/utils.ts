import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Truncate a long hex / address for display: 0x1234…cdef */
export function truncate(value: string, head = 6, tail = 4): string {
  if (!value) return "";
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** Format a 7-decimal mock-USDC base-unit amount (string/bigint) for display. */
export function formatMockUsdc(baseUnits: string | bigint, decimals = 7): string {
  const v = BigInt(baseUnits);
  const negative = v < 0n;
  const abs = negative ? -v : v;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const frac = abs % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const out = fracStr ? `${wholeStr}.${fracStr}` : wholeStr;
  return negative ? `-${out}` : out;
}

/** Parse a human mock-USDC amount into 7-decimal base units (bigint). */
export function parseMockUsdc(human: string, decimals = 7): bigint {
  const trimmed = human.trim();
  if (!/^\d*(\.\d*)?$/.test(trimmed) || trimmed === "" || trimmed === ".") {
    throw new Error("Enter a valid amount");
  }
  const [whole, frac = ""] = trimmed.split(".");
  const paddedFrac = frac.slice(0, decimals).padEnd(decimals, "0");
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(paddedFrac || "0");
}

export function stellarExpertTx(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export function stellarExpertContract(id: string): string {
  return `https://stellar.expert/explorer/testnet/contract/${id}`;
}

export function stellarExpertAccount(id: string): string {
  return `https://stellar.expert/explorer/testnet/account/${id}`;
}
