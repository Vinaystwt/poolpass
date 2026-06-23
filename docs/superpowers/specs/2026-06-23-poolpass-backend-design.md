# PoolPass Backend Design

## Goal

Build and deploy a complete Stellar-testnet backend for PoolPass: a self-serve RWA subscription flow gated by a real BN254 Groth16 proof, a Merkle tree whose root is recomputed on-chain with Stellar's native Poseidon host function, escrow and pool-token settlement, replay protection, public demo accreditation, persistence, proving, independent verification, and a reproducible end-to-end test.

The attached PoolPass master prompt is the approved product and protocol specification. This document resolves current platform details that the prompt deliberately leaves open.

## Gate-first architecture

No product feature work begins until two testnet gates pass.

Gate A uses classic Poseidon over BN254 Fr, not Poseidon2. CAP-0075 exposes configurable Poseidon and Poseidon2 permutations rather than one fixed hash. PoolPass uses the audited interoperability path provided by Stellar's `soroban-poseidon` 26.0.0 crate, which calls `Env::crypto_hazmat().poseidon_permutation` with circomlib-compatible presets. Binary hashing uses state width `t=3`, S-box degree 5, 8 full rounds, 57 partial rounds, a capacity element of zero, inputs in state positions 1 and 2, and output at state position 0. Three-input leaf hashing uses `t=4`, degree 5, 8 full rounds, and 56 partial rounds. The gate compares `Poseidon([1,2])` across `circomlibjs`, a compiled Circom `Poseidon(2)` circuit, and a testnet Soroban contract; the expected decimal output is `7853200120776062878684798364095072458815029376092732009249414926327459813530` (`0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a`).

Gate B adapts Stellar's canonical Groth16 verifier equation to SDK 26.1.0 BN254 types and native `env.crypto().bn254()` operations. Points use the SDK's Ethereum-compatible uncompressed form: G1 is `x || y`, each 32-byte big-endian; G2 is `x.c1 || x.c0 || y.c1 || y.c0`, each limb 32-byte big-endian. This means each snarkjs Fp2 coordinate pair `[c0,c1]` is serialized in reversed limb order. The gate generates a small Circom BN254 proof, deploys the verifier, and verifies it in a real testnet invocation.

Testnet currently runs Protocol 27, which includes the Protocol-25 BN254 and Poseidon host functions. Contracts pin stable SDK 26.1.0 and `soroban-poseidon` 26.0.0.

## Components and boundaries

- `circuits/` owns the dummy gate circuit, PoolPass circuit, trusted-setup scripts, compiled artifacts, verification keys, example inputs, known-good proof, and public signals.
- `merkle-tools/` owns the one shared off-chain Poseidon implementation, tree construction, path generation, proof serialization, and fixtures. Serialized field values are canonical 32-byte big-endian hex.
- `contracts/gate-poseidon/` is the smallest possible native-host parity contract.
- `contracts/gate-groth16/` verifies the dummy proof with native BN254 operations.
- `contracts/poolpass/` owns issuer state, native Poseidon root recomputation, native BN254 Groth16 verification, public-input binding, nullifiers, commitments, transfer/mint settlement, events, and read methods.
- Mock USDC uses a testnet Stellar Asset Contract controlled by the generated deployer account. The pool token is a second SAC whose admin is transferred to PoolPass after initialization, avoiding a redundant custom token implementation while keeping the simulation clearly labelled.
- `services/api/` exposes accreditation, pool reads, faucet, `/prove`, and `/verify`. Secrets remain client-side for accreditation; `/prove` is explicitly a fallback where callers voluntarily submit private circuit inputs.
- `services/indexer/` ingests Soroban RPC events and persists normalized records in a lightweight JSON store using cursor checkpoints.
- `scripts/` owns idempotent identity generation/funding, deployment, contract invocation helpers, and the full testnet e2e loop.
- Root `deployments.json` is the only runtime address registry. It records network metadata, contract IDs, asset contract IDs, public keys, gate transaction hashes, and e2e transaction hashes; no secret keys are committed or printed.

## Contract data and flow

`initialize` stores issuer, USDC SAC, pool-token SAC, a serialized BN254 verification key in `Bytes`, depth, name, and epoch zero. The byte layout is decoded into SDK BN254 types only during verification. `update_accredited_set` requires issuer authorization, requires exactly `2^depth` canonical leaf hashes for the demo tree, creates one reusable Poseidon sponge, hashes pairs level-by-level using native host calls, stores the root, increments epoch, and emits `RootUpdated`.

`subscribe` requires investor authorization and validates call-level amount positivity before settlement. It decodes the typed proof and public signals, computes the Groth16 linear combination with native BN254 G1 multiplication/addition, and performs the native four-pair pairing check. It then binds signals in this exact order: `[merkle_root, amount, nullifier, epoch]`; checks stored root and epoch; checks the amount equals the call argument and fits `i128`; rejects a used nullifier; computes `Poseidon([nullifier, amount, epoch])` with the three-input circomlib-compatible preset; marks the nullifier and commitment; transfers mock USDC from investor to PoolPass; mints equal pool tokens to the investor through SAC admin authorization; increments total; and emits `Subscribed`. Soroban transaction atomicity rolls all writes back if transfer or mint fails.

Errors have stable codes: 1 `Unauthorized`, 2 `InvalidProof`, 3 `RootMismatch`, 4 `EpochMismatch`, 5 `NullifierUsed`, 6 `AmountInvalid`, 7 `PaymentFailed`, 8 `NotInitialized`. Authorization failures raised by `require_auth` remain host authorization errors; `Unauthorized` covers explicit issuer/address mismatch checks.

## Service data flow

`POST /accredit` accepts only a canonical leaf hash. The issuer service maintains a deterministic eight-leaf set, padding unused slots with a documented empty leaf. It submits the full set on-chain, waits for finality, rebuilds the same tree off-chain, and returns the path, index bits, index, root, and new epoch for that leaf. Concurrent requests are serialized so a response always corresponds to the committed epoch.

`POST /faucet` mints mock USDC from the service-controlled issuer account to a valid Stellar address with rate limiting suitable for a public demo. `POST /prove` validates a bounded depth-three input payload, invokes pinned snarkjs against committed artifacts, and returns native snarkjs proof JSON, public signals, and Soroban serialization. `POST /verify` reads the committed/on-chain-equivalent verification key and runs `snarkjs.groth16.verify`. Pool and subscription reads come from the indexer's durable normalized store, with direct RPC refresh when data is stale.

## Testing and evidence

Every behavior is developed red-green: unit tests are written and observed failing before implementation. Off-chain tests cover field canonicalization, Poseidon vectors, tree/path behavior, serialization ordering, input validation, API concurrency, indexer normalization, and deployment registry behavior. Contract tests cover root parity, valid proof, replay, wrong epoch, tampering, authorization, settlement, and atomic failure. Integration tests invoke built WASM where practical.

The final `scripts/e2e.ts` uses generated/funded testnet identities and `deployments.json`, submits the eight-leaf root, creates a fresh real proof, performs the subscription, compares pre/post SAC balances, submits the same proof again, asserts decoded `NullifierUsed`, and records both transaction hashes plus explorer links. Completion requires fresh passing unit, build, service, serialization, gate, and e2e commands and an accurate `FRONTEND_INTEGRATION.md`.

## Security and scope decisions

This is hackathon/testnet software. The setup is a documented single-contributor Phase-1 ceremony; mock USDC is clearly labelled; amount is public and the commitment does not hide it; `/prove` is a privacy-degrading fallback; no proof, Poseidon result, settlement, replay result, or explorer link may be mocked. Tree depth remains fixed at three for the demo while the circuit and storage record the depth for later expansion.

No hardcoded secret is stored in Git. CLI identities live in Stellar's local keystore and optional derived deployment metadata contains public keys only. All Git commits use `git write-tree`, `git commit-tree`, and `git update-ref`; `git commit` is never used.
