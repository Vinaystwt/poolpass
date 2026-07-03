/**
 * Decodes every PoolPass contract error (codes 1-8 from FRONTEND_INTEGRATION.md)
 * plus Soroban host-auth and wallet-rejection failures into human messages.
 * A raw `Error(Contract, #N)` must never reach the user.
 */
export interface FriendlyError {
  code?: number;
  variant?: string;
  title: string;
  message: string;
}

const CONTRACT_ERRORS: Record<number, { variant: string; message: string }> = {
  1: { variant: "Unauthorized", message: "This wallet is not authorized for that issuer action." },
  2: { variant: "InvalidProof", message: "The zero-knowledge proof is invalid." },
  3: { variant: "RootMismatch", message: "Accreditation changed; request a fresh Merkle path and proof." },
  4: { variant: "EpochMismatch", message: "The subscription epoch changed; regenerate the nullifier and proof." },
  5: { variant: "NullifierUsed", message: "This investor already subscribed in the current epoch." },
  6: { variant: "AmountInvalid", message: "The amount is invalid or differs from the proof." },
  7: { variant: "PaymentFailed", message: "Testnet USDC settlement failed; obtain faucet funds and retry." },
  8: { variant: "NotInitialized", message: "Pool state is not initialized." },
};

function extractContractCode(text: string): number | undefined {
  // Matches: Error(Contract, #5)  |  ContractError(5)  |  #5
  const m =
    text.match(/Error\(Contract,\s*#(\d+)\)/) ??
    text.match(/ContractError\((\d+)\)/) ??
    text.match(/#(\d+)/);
  if (!m) return undefined;
  const code = Number(m[1]);
  return CONTRACT_ERRORS[code] ? code : undefined;
}

export function decodeError(error: unknown): FriendlyError {
  const text =
    error instanceof Error
      ? `${error.message} ${(error as { stack?: string }).stack ?? ""}`
      : typeof error === "string"
        ? error
        : JSON.stringify(error ?? "");

  const code = extractContractCode(text);
  if (code !== undefined) {
    const e = CONTRACT_ERRORS[code];
    return { code, variant: e.variant, title: e.variant, message: e.message };
  }

  // Wallet / host-auth failures
  const lower = text.toLowerCase();
  if (lower.includes("user declined") || lower.includes("rejected") || lower.includes("denied")) {
    return { title: "Signature declined", message: "You declined the request in your wallet. Nothing was submitted." };
  }
  if (lower.includes("freighter") && lower.includes("not")) {
    return { title: "Freighter not found", message: "Install the Freighter wallet extension, then reconnect." };
  }
  if (lower.includes("auth") && (lower.includes("invalid") || lower.includes("fail"))) {
    return { title: "Authorization failed", message: "The wallet authorization did not match what the contract expected. Reconnect and retry." };
  }
  if (lower.includes("insufficient") || lower.includes("underfunded")) {
    return { title: "Insufficient balance", message: "Not enough XLM or Testnet USDC. Use the faucet, then retry." };
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("timeout")) {
    return { title: "Network error", message: "Could not reach the network. Check your connection and retry." };
  }

  // Fallback, never leak a raw contract error
  return { title: "Something went wrong", message: "The action could not be completed. Please retry." };
}

export const ERROR_TABLE = CONTRACT_ERRORS;
