# PoolPass Backend

PoolPass is a Stellar-testnet hackathon backend for proof-gated RWA subscriptions. It uses native Soroban BN254 pairing operations for Groth16 verification and the native CAP-0075 Poseidon permutation through Stellar's circomlib-compatible helper crate.

Status: complete. Both cryptographic gates, the production circuit, native-host PoolPass contract, mock assets, self-serve API, persistent event indexer, fallback prover/verifier, real settlement loop, finalized replay failure, and fresh-address self-serve loop are verified on Stellar testnet. See `FRONTEND_INTEGRATION.md` for the exact frontend contract and `deployments.json` for machine-readable IDs/evidence.

## Pinned toolchain

- Stellar CLI 25.2.0
- Testnet protocol observed at setup: 27
- Rust 1.94.1 (contracts declare MSRV 1.91.0)
- soroban-sdk 26.1.0
- soroban-poseidon 26.0.0
- Circom 2.2.2
- snarkjs 0.7.6
- Node.js 24.x

Mock USDC and the Phase-1 trusted setup are testnet/hackathon simulations and must not be represented as production assets or a multi-party ceremony. Subscription amount is public; the emitted commitment does not hide it.

## Reproduce

```bash
pnpm gate:a
pnpm gate:b
pnpm circuit:build
pnpm circuit:prove
cargo test --workspace
pnpm deploy:testnet
pnpm e2e:testnet
pnpm api:smoke
pnpm selfserve:smoke
pnpm indexer:once
```

`pnpm deploy:testnet` is idempotent: it reuses live instances only when their recorded WASM hash matches the local optimized build. `pnpm faucet <G...> [amount]` mints at most 10,000 mock USDC per call through the test-issuer identity. Secrets remain in the Stellar CLI keystore and never enter deployment metadata.
