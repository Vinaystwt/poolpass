# PoolPass Backend

PoolPass is a Stellar-testnet hackathon backend for proof-gated RWA subscriptions. It uses native Soroban BN254 pairing operations for Groth16 verification and the native CAP-0075 Poseidon permutation through Stellar's circomlib-compatible helper crate.

Status: Phase 0 foundations and cryptographic gates are in progress. No product feature is considered implemented until both gates pass on testnet.

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
