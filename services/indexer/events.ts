import { scValToNative, xdr } from "@stellar/stellar-sdk";

export interface RpcContractEvent {
  id: string;
  type: string;
  ledger: number;
  ledgerClosedAt: string;
  contractId: string;
  txHash: string;
  topic: string[];
  value: string;
  inSuccessfulContractCall: boolean;
}

function decode(value: string): unknown {
  return scValToNative(xdr.ScVal.fromXDR(value, "base64"));
}

function jsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Buffer.from(value).toString("hex");
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonSafe(item)]));
  }
  return value;
}

export interface IndexedEvent {
  id: string;
  name: string;
  poolId?: string;
  contractId: string;
  txHash: string;
  ledger: number;
  closedAt: string;
  epoch?: number;
  data: unknown;
}

export function normalizeEvent(
  event: RpcContractEvent,
  poolIdForContract: (contractId: string) => string | undefined = () => undefined,
): IndexedEvent {
  const topics = event.topic.map(decode);
  const poolId = poolIdForContract(event.contractId);
  return {
    id: event.id,
    name: String(topics[0]),
    ...(poolId ? { poolId } : {}),
    contractId: event.contractId,
    txHash: event.txHash,
    ledger: event.ledger,
    closedAt: event.ledgerClosedAt,
    epoch: typeof topics[1] === "number" ? topics[1] : undefined,
    data: jsonSafe(decode(event.value)),
  };
}
