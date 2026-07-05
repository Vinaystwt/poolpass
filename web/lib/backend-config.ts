/**
 * The single typed gateway to the PoolPass backend integration contract.
 *
 * Every contract address, network identity, public-input order, byte-layout
 * constant, event name, and HTTP endpoint is sourced from deployments.json
 * (the machine-readable source of truth) and from FRONTEND_INTEGRATION.md.
 *
 * Component code MUST import from here, never hardcode a contract id, a field
 * modulus, or a public-signal index inline. If a value is missing from the JSON
 * it is missing here too; do not invent it.
 */
import deployments from "./deployments.json";

export const DEPLOYMENTS = deployments;
const rawDeployments = deployments as typeof deployments & {
  contracts: typeof deployments.contracts & {
    poolpass?: { contractId: string; wasmHash?: string };
    poolToken?: { contractId: string; wasmHash?: string };
  };
  pools?: Array<{
    id: string;
    name: string;
    contractId: string;
    poolToken: string;
    merkleDepth: number;
    perInvestorCapPublic: string;
    issuer: string;
    vk: string;
    gateDescription: string;
    assetClass?: string;
    riskProfile?: string;
  }>;
};

// ── Network ────────────────────────────────────────────────────────────────
export const NETWORK = {
  name: deployments.network.name,
  rpcUrl: deployments.network.rpcUrl,
  passphrase: deployments.network.passphrase,
  protocolVersion: deployments.network.protocolVersion,
} as const;

// ── Public identities ────────────────────────────────────────────────────────
export const ACCOUNTS = {
  deployer: deployments.accounts.deployer.publicKey,
  demoIssuer: deployments.accounts["test-issuer"].publicKey,
  fixtureInvestor: deployments.accounts["test-investor"].publicKey,
} as const;

// ── Contracts ────────────────────────────────────────────────────────────────
export const POOLS =
  rawDeployments.pools ??
  [
    {
      id: "demo",
      name: "Demo Credit Pool",
      contractId: rawDeployments.contracts.poolpass?.contractId ?? "",
      poolToken: rawDeployments.contracts.poolToken?.contractId ?? "",
      merkleDepth: 3,
      perInvestorCapPublic: "",
      issuer: deployments.accounts["test-issuer"].publicKey,
      vk: "circuits/verification_key.json",
      gateDescription: "Legacy single PoolPass demo pool.",
    },
  ];

const DEFAULT_POOL = POOLS[0];

export const CONTRACTS = {
  poolpass: DEFAULT_POOL.contractId,
  mockUsdc: deployments.contracts.mockUsdc.contractId,
  poolToken: DEFAULT_POOL.poolToken,
  gatePoseidon: deployments.contracts.gatePoseidon.contractId,
  gateGroth16: deployments.contracts.gateGroth16.contractId,
} as const;

export const WASM_HASHES = {
  poolpass: rawDeployments.contracts.poolpass?.wasmHash ?? "",
  mockUsdc: deployments.contracts.mockUsdc.wasmHash,
  poolToken: rawDeployments.contracts.poolToken?.wasmHash ?? deployments.contracts.mockUsdc.wasmHash,
  gatePoseidon: deployments.contracts.gatePoseidon.wasmHash,
  gateGroth16: deployments.contracts.gateGroth16.wasmHash,
} as const;

// ── Asset facts (honesty rule) ───────────────────────────────────────────────
export const MOCK_USDC = {
  decimals: 7,
  /** A real 7-decimal SAC token on Stellar testnet, used deliberately for the demo. */
  labelLong: "Testnet USDC (a 7-decimal test asset on Stellar testnet)",
  labelShort: "Testnet USDC",
  ticker: "tUSDC",
} as const;

// ── Circuit / proof system ───────────────────────────────────────────────────
export const FIELD = {
  // BN254 scalar field Fr (public signals live here)
  FR_MODULUS:
    21888242871839275222246405745257275088548364400416034343698204186575808495617n,
  // BN254 base field Fp (curve point coordinates)
  FP_MODULUS:
    21888242871839275222246405745257275088696311157297823662689037894645226208583n,
} as const;

/** Public-input order is fixed by the deployed circuit. Do not reorder. */
export const PUBLIC_INPUT_ORDER = ["merkle_root", "amount", "nullifier", "epoch"] as const;
export type PublicInputName = (typeof PUBLIC_INPUT_ORDER)[number];

export const CIRCUIT = {
  protocol: "groth16",
  curve: "bn128",
  merkleDepth: 3,
  treeLeaves: 8,
  publicSignalCount: 4,
  proofBytes: 256, // A G1(64) || B G2(128) || C G1(64)
  icLen: 5, // publicSignalCount + 1
  amountBits: 64,
} as const;

/** Artifacts served from /public/zk (sha256 verified against artifact-manifest.json). */
export const ZK_ARTIFACTS = {
  wasm: "/zk/poolpass.wasm",
  zkey: "/zk/poolpass_final.zkey",
  verificationKey: "/zk/verification_key.json",
  demoProofPackage: "/zk/demo-proof-package.json",
  demoInput: "/zk/demo-input.json",
} as const;

// ── HTTP API (PoolPass services) ─────────────────────────────────────────────
/** Backend services base URL; overridable for local dev via NEXT_PUBLIC_API_BASE. */
export function resolveApiBase(value: string | undefined): string {
  return value?.replace(/\/$/, "") || "https://poolpass-vh80.onrender.com";
}

export const API_BASE = resolveApiBase(process.env.NEXT_PUBLIC_API_BASE);

export const API = {
  accredit: `${API_BASE}/accredit`,
  faucet: `${API_BASE}/faucet`,
  prove: `${API_BASE}/prove`, // FALLBACK ONLY, see proving-path status
  verify: `${API_BASE}/verify`,
  poolDemo: `${API_BASE}/pool/demo`,
} as const;

/** Faucet cap: 100,000,000,000 base units = 10,000 mock USDC per window/address. */
export const FAUCET_CAP_BASE_UNITS = "100000000000";

// ── Events ───────────────────────────────────────────────────────────────────
export const EVENT_NAMES = {
  rootUpdated: "root_updated",
  subscribed: "subscribed",
  epochAdvanced: "epoch_advanced",
} as const;

export const EXTERNAL_LINKS = {
  freighterInstall: "https://www.freighter.app/",
  repo: "https://github.com/Vinaystwt/poolpass",
  stellar: "https://stellar.org/",
  soroban: "https://developers.stellar.org/docs/build/smart-contracts",
  circom: "https://docs.circom.io/",
  snarkjs: "https://github.com/iden3/snarkjs",
  circomlib: "https://github.com/iden3/circomlib",
  bachiniTutorial: "https://www.youtube.com/@blockchainexpertshub",
  groth16Verifier:
    "https://github.com/stellar/soroban-examples",
} as const;
