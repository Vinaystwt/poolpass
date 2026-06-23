# PoolPass Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the complete PoolPass backend on Stellar testnet with native-host Poseidon and BN254 Groth16 gates, real token settlement, self-serve accreditation, persistent indexing, fallback proving, independent verification, and a passing replay-protected e2e loop.

**Architecture:** A Rust workspace contains two minimal gate contracts and the PoolPass contract. Circom/snarkjs and a shared TypeScript library own proofs, Poseidon tree construction, serialization, deployment, services, and e2e verification. Root `deployments.json` is the sole address/evidence registry; Stellar CLI identities hold secrets outside Git.

**Tech Stack:** Rust 1.94.1, soroban-sdk 26.1.0, soroban-poseidon 26.0.0, Stellar CLI 25.2.0, Circom 2.2.2, snarkjs 0.7.6, Node 24, TypeScript 5, Vitest, Fastify, `@stellar/stellar-sdk`, circomlib/circomlibjs.

---

## File map

- `Cargo.toml`, `rust-toolchain.toml`: pinned Soroban workspace.
- `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`: pinned Node workspace and test/build commands.
- `contracts/gate-poseidon/`: one-call native Poseidon parity contract.
- `contracts/gate-groth16/`: dummy native BN254 verifier contract.
- `contracts/poolpass/`: product state machine, native crypto checks, settlement, events, and contract tests.
- `circuits/gates/`: pair-hash and multiplication gate circuits plus generated evidence.
- `circuits/poolpass.circom`, `circuits/scripts/`, `circuits/build/`: production circuit and reproducible ceremony/proof pipeline.
- `src/crypto/poseidon.ts`, `src/crypto/field.ts`: shared off-chain field and Poseidon functions.
- `src/merkle/`: deterministic tree and proof paths.
- `src/serialization/`: snarkjs-to-Soroban proof/VK/public-signal layouts.
- `src/stellar/`: CLI/RPC process wrappers, identities, deployment registry, and typed invocation helpers.
- `services/api/`: demo issuer, faucet, proving, verify, and pool routes.
- `services/indexer/`: RPC event ingestion and durable cursor/store.
- `scripts/`: gates, deployments, fixture generation, and e2e.
- `docs/`: phase evidence, serialization, errors, and operational notes.
- `deployments.json`: public testnet IDs, keys, and transaction evidence.
- `FRONTEND_INTEGRATION.md`: exact frontend contract.

Every commit step below uses:

```bash
git add <listed-files>
TREE=$(git write-tree)
PARENT=$(git rev-parse HEAD)
COMMIT=$(printf '%s' '<message>' | git commit-tree "$TREE" -p "$PARENT")
git update-ref HEAD "$COMMIT"
```

### Task 1: Pin the workspace and validate the toolchain

**Files:**
- Create: `Cargo.toml`
- Create: `rust-toolchain.toml`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `tests/toolchain.test.ts`
- Create: `scripts/check-toolchain.ts`
- Create: `README.md`

- [ ] **Step 1: Write the failing version-contract test**

```ts
import { describe, expect, test } from "vitest";
import { expectedVersions, readVersions } from "../scripts/check-toolchain.js";

describe("pinned toolchain", () => {
  test("matches the versions required by deployed artifacts", async () => {
    expect(await readVersions()).toEqual(expectedVersions);
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/toolchain.test.ts`
Expected: FAIL because the Node workspace and `check-toolchain.ts` do not exist.

- [ ] **Step 3: Add pinned manifests and version reader**

Pin `soroban-sdk = "=26.1.0"`, `soroban-poseidon = "=26.0.0"`, `snarkjs = "0.7.6"`, `circomlib = "2.0.5"`, `circomlibjs = "0.1.7"`, TypeScript, Vitest, Fastify, Zod, and Stellar SDK. Implement `readVersions()` with `execFile`, parse semantic versions, and fail with an actionable mismatch. Install Circom 2.2.2 into a gitignored `.tools/bin` from its official release or source build and make scripts prefer that binary.

- [ ] **Step 4: Run GREEN and baseline builds**

Run: `npm ci && npm test -- tests/toolchain.test.ts && cargo metadata --no-deps`
Expected: one passing test and successful Cargo metadata.

- [ ] **Step 5: Commit**

Commit message: `build: pin PoolPass toolchains`

### Task 2: Generate and fund testnet identities without exposing secrets

**Files:**
- Create: `src/stellar/process.ts`
- Create: `src/stellar/identities.ts`
- Create: `src/stellar/identities.test.ts`
- Create: `scripts/setup-identities.ts`
- Create: `deployments.schema.json`
- Create: `deployments.json`

- [ ] **Step 1: Write failing tests for redaction and idempotence**

```ts
test("never includes a secret key in public deployment metadata", () => {
  expect(publicIdentity({ publicKey: "GABC", secretKey: "SSECRET" })).toEqual({ publicKey: "GABC" });
});

test("creates only identities missing from the CLI keystore", async () => {
  const calls: string[][] = [];
  await ensureIdentities(fakeRunner(calls), ["deployer", "test-issuer", "test-investor"]);
  expect(calls.filter((c) => c.includes("generate"))).toHaveLength(2);
});
```

- [ ] **Step 2: Run RED**

Run: `npm test -- src/stellar/identities.test.ts`
Expected: FAIL because identity helpers are missing.

- [ ] **Step 3: Implement safe CLI identity setup**

Use `stellar keys address <name>` to detect existing entries, `stellar keys generate <name> --network testnet --fund` for missing entries, and Friendbot retries only if `--fund` fails. Capture stdout internally, expose public keys only, reject any log line matching `/S[A-Z2-7]{55}/`, and atomically merge public keys/network protocol into `deployments.json`.

- [ ] **Step 4: Run GREEN and create/fund identities**

Run: `npm test -- src/stellar/identities.test.ts && npm run identities`
Expected: tests pass; all three addresses are printed; no secret begins with `S`; Horizon account lookups return HTTP 200.

- [ ] **Step 5: Commit**

Commit message: `feat: provision testnet identities safely`

### Task 3: Pass Gate A—Poseidon parity across JS, Circom, and testnet Soroban

**Files:**
- Create: `contracts/gate-poseidon/Cargo.toml`
- Create: `contracts/gate-poseidon/src/lib.rs`
- Create: `contracts/gate-poseidon/src/test.rs`
- Create: `circuits/gates/poseidon_pair.circom`
- Create: `src/crypto/field.ts`
- Create: `src/crypto/poseidon.ts`
- Create: `src/crypto/poseidon.test.ts`
- Create: `scripts/gate-a.ts`
- Create: `docs/gates/poseidon.md`

- [ ] **Step 1: Write the failing JS vector test**

```ts
test("matches circomlib Poseidon([1,2])", async () => {
  expect(await poseidon([1n, 2n])).toBe(7853200120776062878684798364095072458815029376092732009249414926327459813530n);
});
```

- [ ] **Step 2: Run JS RED, implement, and run GREEN**

Run RED: `npm test -- src/crypto/poseidon.test.ts`
Implement one cached `buildPoseidon()` instance, canonical BN254 Fr checks, decimal/hex conversion, `poseidon2(a,b)`, and `poseidon3(a,b,c)`.
Run GREEN: `npm test -- src/crypto/poseidon.test.ts`

- [ ] **Step 3: Write the failing Rust vector test**

```rust
#[test]
fn hash_two_matches_circomlib() {
    let env = Env::default();
    let id = env.register(GatePoseidon, ());
    let got = GatePoseidonClient::new(&env, &id).hash_two(&U256::from_u32(&env, 1), &U256::from_u32(&env, 2));
    assert_eq!(got.to_string(), String::from_str(&env, "7853200120776062878684798364095072458815029376092732009249414926327459813530"));
}
```

- [ ] **Step 4: Run Rust RED, implement native host call, and run GREEN**

Run RED: `cargo test -p gate-poseidon`
Implement `hash_two` with `soroban_poseidon::poseidon_hash::<3, Bn254Fr>` and no userland hashing.
Run GREEN: `cargo test -p gate-poseidon`

- [ ] **Step 5: Compile the Circom circuit and assert its witness**

`poseidon_pair.circom` instantiates circomlib `Poseidon(2)`, exposes the output, and uses `[1,2]`. Run the pinned compiler and witness generator; assert the witness output equals the same decimal vector via `snarkjs wtns export json`.

- [ ] **Step 6: Deploy and invoke the gate contract on testnet**

Build with `stellar contract build --package gate-poseidon`, deploy from `deployer`, invoke `hash_two(1,2)`, assert the decoded U256 equals both local results, and record contract ID, deployment hash, invocation hash, ledger, protocol, and explorer URLs in `deployments.json` and `docs/gates/poseidon.md`.

- [ ] **Step 7: Hard-gate decision and commit**

Run: `npm run gate:a`
Expected: all three values equal and testnet transaction status is `SUCCESS`. If not, stop without Task 4.
Commit message: `test: prove Poseidon parity on testnet`

### Task 4: Pass Gate B—native BN254 dummy Groth16 verification on testnet

**Files:**
- Create: `circuits/gates/multiplier.circom`
- Create: `circuits/scripts/setup-gate-b.sh`
- Create: `src/serialization/bytes.ts`
- Create: `src/serialization/groth16.ts`
- Create: `src/serialization/groth16.test.ts`
- Create: `contracts/gate-groth16/Cargo.toml`
- Create: `contracts/gate-groth16/src/lib.rs`
- Create: `contracts/gate-groth16/src/test.rs`
- Create: `scripts/gate-b.ts`
- Create: `docs/serialization.md`
- Create: `docs/gates/groth16.md`

- [ ] **Step 1: Write failing serialization tests**

```ts
test("serializes snarkjs G2 as x.c1|x.c0|y.c1|y.c0", () => {
  const proof = fixtureProof({ pi_b: [["1", "2"], ["3", "4"], ["1", "0"]] });
  expect(serializeProof(proof).subarray(64, 192)).toEqual(Buffer.concat([be32(2n), be32(1n), be32(4n), be32(3n)]));
});

test("rejects non-canonical coordinates", () => {
  expect(() => be32(BN254_FP_MODULUS)).toThrow(/canonical/);
});
```

- [ ] **Step 2: Run RED, implement layouts, and run GREEN**

Run RED: `npm test -- src/serialization/groth16.test.ts`
Implement G1 `x|y`, G2 `c1|c0` per coordinate, proof `A|B|C`, VK `alpha|beta|gamma|delta|u32(ic_len)|IC[]`, and public Fr values as 32-byte BE.
Run GREEN: `npm test -- src/serialization/groth16.test.ts`

- [ ] **Step 3: Generate a fresh dummy proof and verify off-chain**

Compile `a*b===c` with `c` public, generate a local Phase-1 setup, prove `3*11=33`, export VK, and run `snarkjs groth16 verify`. Expected: `OK!`.

- [ ] **Step 4: Write the failing contract verifier tests**

Tests load the generated byte fixtures and assert valid proof true, public signal `22` false, tampered A false, and malformed VK returns stable `MalformedVerificationKey` rather than trapping.

- [ ] **Step 5: Run Rust RED, adapt canonical verifier, and run GREEN**

Run RED: `cargo test -p gate-groth16`
Implement bounds-checked byte slicing; wrap SDK `Bn254G1Affine`, `Bn254G2Affine`, and `Bn254Fr`; compute `vk_x = IC[0] + Σ signal[i]*IC[i+1]`; run `e(-A,B)e(alpha,beta)e(vk_x,gamma)e(C,delta)==1` with `env.crypto().bn254().pairing_check`.
Run GREEN: `cargo test -p gate-groth16`

- [ ] **Step 6: Deploy and verify on testnet**

Deploy the gate contract and invoke with serialized VK, proof, and `[33]`. Record deployment and successful verification transaction hashes and explorer links. Invoke the tampered proof and record its false result or contract error without accepting it.

- [ ] **Step 7: Hard-gate decision and commit**

Run: `npm run gate:b`
Expected: off-chain `OK!`, on-chain true, tampered false, testnet success hash recorded. If not, stop without Task 5.
Commit message: `test: prove native BN254 verification on testnet`

### Task 5: Build the PoolPass circuit and known-good artifacts

**Files:**
- Create: `circuits/poolpass.circom`
- Create: `circuits/README.md`
- Create: `circuits/scripts/build-poolpass.sh`
- Create: `circuits/scripts/prove-example.sh`
- Create: `circuits/fixtures/investors.csv`
- Create: `circuits/example_input.json`
- Create: `circuits/proof.json`
- Create: `circuits/public.json`
- Create: `circuits/verification_key.json`
- Create: `circuits/artifact-manifest.json`
- Create: `tests/circuit.test.ts`

- [ ] **Step 1: Write failing witness behavior tests**

Tests require a valid member/cap witness, reject `amount=cap+1`, reject a wrong path, reject a nullifier computed from another secret, and assert public output order `[root, amount, nullifier, epoch]`.

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/circuit.test.ts`
Expected: FAIL because the circuit/artifacts are absent.

- [ ] **Step 3: Implement the circuit**

Use circomlib `Poseidon(3)` for `leaf`, `Poseidon(2)` at each of three Merkle levels, `LessEqThan(64)` for amount/cap, and `Poseidon(2)` for nullifier. Constrain every index bit with `IsBoolean` and select left/right algebraically. Declare public inputs in the exact contract order.

- [ ] **Step 4: Compile, ceremony, fixture proof, and GREEN**

Run the pinned compiler with R1CS/WASM/sym; print constraint count; perform documented Phase-1 setup; export VK; build example input from the shared tree; generate and verify proof; hash every artifact into `artifact-manifest.json`.
Run: `npm test -- tests/circuit.test.ts && npx snarkjs groth16 verify circuits/verification_key.json circuits/public.json circuits/proof.json`
Expected: all cases pass and verification prints `OK!`.

- [ ] **Step 5: Commit**

Commit message: `feat: add PoolPass Groth16 circuit and fixtures`

### Task 6: Build Merkle and proof tooling

**Files:**
- Create: `src/merkle/tree.ts`
- Create: `src/merkle/tree.test.ts`
- Create: `merkle-tools/poseidon.js`
- Create: `merkle-tools/build_tree.js`
- Create: `merkle-tools/generate_path.js`
- Create: `merkle-tools/serialize_proof.js`
- Create: `merkle-tools/README.md`
- Create: `circuits/fixtures/tree.json`
- Create: `circuits/fixtures/proof-package.json`

- [ ] **Step 1: Write failing tree/path tests**

```ts
test("builds eight leaves and verifies every generated path", async () => {
  const tree = await buildTree(records);
  expect(tree.levels.map((x) => x.length)).toEqual([8,4,2,1]);
  for (let i=0; i<8; i++) expect(await verifyPath(tree.leaves[i], pathFor(tree,i))).toBe(tree.root);
});
```

- [ ] **Step 2: Run RED, implement, and run GREEN**

Require exactly eight rows, reject duplicates and non-canonical values, hash leaf as Poseidon3, hash nodes as Poseidon2, emit path indices where `0=current-left`, and expose thin CLI wrappers that import the same source module.
Run: `npm test -- src/merkle/tree.test.ts`

- [ ] **Step 3: Generate committed fixtures and cross-check the circuit**

Run build/path/serialize CLIs; use the package as circuit input; verify the known-good proof; assert fixture hashes in the artifact manifest.

- [ ] **Step 4: Commit**

Commit message: `feat: add shared Merkle and proof tooling`

### Task 7: Implement PoolPass state, root recomputation, and errors

**Files:**
- Create: `contracts/poolpass/Cargo.toml`
- Create: `contracts/poolpass/src/lib.rs`
- Create: `contracts/poolpass/src/types.rs`
- Create: `contracts/poolpass/src/storage.rs`
- Create: `contracts/poolpass/src/poseidon.rs`
- Create: `contracts/poolpass/src/test.rs`
- Create: `docs/errors.md`

- [ ] **Step 1: Write failing initialization and root tests**

Tests assert initialize-once, uninitialized reads, issuer-only updates, exact eight-leaf count, epoch increment, event payload, and equality with `tree.json` root.

- [ ] **Step 2: Run RED**

Run: `cargo test -p poolpass root`
Expected: FAIL because the contract is absent.

- [ ] **Step 3: Implement minimal state and native root folding**

Define stable `#[contracterror]` codes 1–8 and storage keys from the approved spec. Convert `BytesN<32>` to U256, construct one `PoseidonSponge::<3,Bn254Fr>` per update, fold pairs, store root/epoch, and publish `RootUpdated`. Add instance/persistent TTL extensions for long-lived demo state.

- [ ] **Step 4: Run GREEN and full contract tests**

Run: `cargo test -p poolpass`
Expected: initialization and root tests pass under resource limits.

- [ ] **Step 5: Commit**

Commit message: `feat: add PoolPass state and native Poseidon root`

### Task 8: Add proof-gated subscription, replay protection, and settlement

**Files:**
- Modify: `contracts/poolpass/src/lib.rs`
- Create: `contracts/poolpass/src/groth16.rs`
- Modify: `contracts/poolpass/src/types.rs`
- Modify: `contracts/poolpass/src/test.rs`
- Create: `contracts/poolpass/src/test_fixtures.rs`

- [ ] **Step 1: Write failing subscription tests**

Tests assert valid proof success, tampered proof `InvalidProof`, wrong root `RootMismatch`, wrong epoch `EpochMismatch`, call/proof amount mismatch `AmountInvalid`, reused nullifier `NullifierUsed`, USDC transfer, pool-token mint, total subscribed, commitment event, and full rollback when payment fails.

- [ ] **Step 2: Run RED**

Run: `cargo test -p poolpass subscribe`
Expected: failures because `subscribe` does not exist.

- [ ] **Step 3: Implement native proof verification and bindings**

Reuse the gate-tested decoder/equation. Require exactly four public signals. Compare canonical BE root/nullifier bytes, checked-convert amount and epoch, and perform all checks before state mutation.

- [ ] **Step 4: Implement atomic settlement**

Use `token::Client::transfer` from investor to current contract and `token::StellarAssetClient::mint` from PoolPass authorization; store nullifier and commitment, update total, and publish `Subscribed`. Keep amount explicitly public in docs.

- [ ] **Step 5: Run GREEN, resource report, and build WASM**

Run: `cargo test -p poolpass && stellar contract build --package poolpass`
Expected: all contract cases pass and optimized WASM builds.

- [ ] **Step 6: Commit**

Commit message: `feat: gate subscriptions with native Groth16 proofs`

### Task 9: Deploy mock assets and PoolPass idempotently

**Files:**
- Create: `src/stellar/deployments.ts`
- Create: `src/stellar/deployments.test.ts`
- Create: `scripts/deploy.ts`
- Create: `scripts/asset.ts`
- Modify: `deployments.json`
- Modify: `README.md`

- [ ] **Step 1: Write failing registry/idempotence tests**

Tests assert an existing live contract is reused, missing code hash triggers upgrade/deploy, registry writes are atomic, no address exists outside `deployments.json`, and secrets are rejected.

- [ ] **Step 2: Run RED, implement, and run GREEN**

Use Stellar CLI JSON output through `execFile`; deploy two test SACs; initialize metadata; deploy PoolPass; initialize with gate-validated VK bytes; set pool-token admin to PoolPass; mint investor mock USDC; verify every recorded contract with RPC.
Run: `npm test -- src/stellar/deployments.test.ts`

- [ ] **Step 3: Deploy on testnet and validate reads**

Run: `npm run deploy:testnet`
Expected: live contract IDs, code hashes, and transaction hashes recorded; rerun produces no orphan contracts and the same IDs.

- [ ] **Step 4: Commit**

Commit message: `feat: deploy PoolPass and mock assets to testnet`

### Task 10: Implement demo issuer, faucet, proving, and verify API

**Files:**
- Create: `services/api/server.ts`
- Create: `services/api/config.ts`
- Create: `services/api/accreditation.ts`
- Create: `services/api/routes/accredit.ts`
- Create: `services/api/routes/faucet.ts`
- Create: `services/api/routes/prove.ts`
- Create: `services/api/routes/verify.ts`
- Create: `services/api/routes/pool.ts`
- Create: `services/api/server.test.ts`
- Create: `.env.example`

- [ ] **Step 1: Write failing route tests**

Use Fastify injection with a real temporary store. Assert leaf-only accreditation, invalid/non-canonical leaf 400, serialized concurrent updates, returned path matches committed root/epoch, faucet address validation/rate limit, bounded proving payload, valid/invalid verification, and pool response schema.

- [ ] **Step 2: Run RED**

Run: `npm test -- services/api/server.test.ts`
Expected: FAIL because routes do not exist.

- [ ] **Step 3: Implement dependency-injected services**

Separate route validation from chain/prover adapters. Accreditation uses an async mutex and full eight-leaf snapshots. Faucet invokes SAC mint with a configured public demo limit. Prover uses `snarkjs.groth16.fullProve`; verify uses the committed VK and returns `{valid:boolean}` without accepting caller VK substitution.

- [ ] **Step 4: Run GREEN and live smoke test**

Run: `npm test -- services/api/server.test.ts && npm run api:smoke`
Expected: tests pass; live `/pool`, `/verify`, faucet, and accreditation return documented schemas.

- [ ] **Step 5: Commit**

Commit message: `feat: add self-serve issuer and proof API`

### Task 11: Implement persistent RPC event indexer

**Files:**
- Create: `services/indexer/store.ts`
- Create: `services/indexer/events.ts`
- Create: `services/indexer/indexer.ts`
- Create: `services/indexer/indexer.test.ts`
- Create: `services/indexer/cli.ts`

- [ ] **Step 1: Write failing normalization and replay tests**

Fixtures contain XDR-decoded `RootUpdated` and `Subscribed` events. Tests assert normalized JSON, dedupe by transaction/event index, cursor resume, atomic persistence, and rebuild from a supplied start ledger.

- [ ] **Step 2: Run RED, implement, and run GREEN**

Poll Soroban RPC `getEvents` by PoolPass contract ID and event topics, decode with Stellar SDK, persist only after a complete page, expose pool stats/subscriptions for API reads.
Run: `npm test -- services/indexer/indexer.test.ts`

- [ ] **Step 3: Live catch-up smoke test**

Run: `npm run indexer:once`
Expected: current cursor and all gate/product events persist across a second run with no duplicates.

- [ ] **Step 4: Commit**

Commit message: `feat: persist PoolPass contract events`

### Task 12: Pass the full real testnet e2e loop

**Files:**
- Create: `scripts/e2e.ts`
- Create: `tests/e2e-helpers.test.ts`
- Modify: `deployments.json`
- Create: `docs/e2e-transcript.md`

- [ ] **Step 1: Write failing helper tests**

Tests assert balance parsing at 7 decimals, transaction finality polling, contract-error decoding (code 5 to `NullifierUsed`), explorer URL formation, and deployment registry evidence updates.

- [ ] **Step 2: Run RED, implement helpers, and run GREEN**

Run: `npm test -- tests/e2e-helpers.test.ts`

- [ ] **Step 3: Implement the real loop**

Load/reuse deployments; mint test USDC; submit eight fixture leaves; assert on-chain root; regenerate witness/proof for current epoch; snapshot both SAC balances; invoke `subscribe`; assert exact USDC decrease/escrow increase and pool-token increase; resubmit identical proof; require finalized failure whose decoded contract code is 5; save command transcript, hashes, ledgers, and explorer links.

- [ ] **Step 4: Run the completion gate**

Run: `npm run e2e:testnet`
Expected: successful subscription hash, exact balance assertions, failed replay hash with `NullifierUsed`, and both explorer URLs.

- [ ] **Step 5: Commit**

Commit message: `test: pass PoolPass real testnet loop`

### Task 13: Produce handoff docs and run final verification

**Files:**
- Create: `FRONTEND_INTEGRATION.md`
- Modify: `README.md`
- Modify: `docs/serialization.md`
- Modify: `docs/errors.md`
- Modify: `circuits/README.md`
- Modify: `deployments.json`

- [ ] **Step 1: Generate the frontend contract from live metadata**

Document all contract IDs/public keys, exact method signatures and ScVal shapes, public signal order, byte layouts, error map, endpoints, privacy caveats, Gate A/B parameters/hashes, e2e transcript, and explorer links. Validate every ID against `deployments.json` and every method against `stellar contract info interface` output.

- [ ] **Step 2: Run the fresh verification matrix**

Run:

```bash
npm ci
npm test
npm run typecheck
cargo fmt --all -- --check
cargo test --workspace
stellar contract build
npx snarkjs groth16 verify circuits/verification_key.json circuits/public.json circuits/proof.json
npm run gate:a:verify
npm run gate:b:verify
npm run indexer:once
npm run api:smoke
npm run e2e:testnet
```

Expected: every command exits 0; all transaction hashes remain queryable and match the recorded successful/failed statuses.

- [ ] **Step 3: Audit the definition of done**

Check every Section 12 requirement from the master prompt against a file, test, RPC result, or transaction hash. Search for mock claims, hardcoded addresses outside `deployments.json`, secret keys, placeholders, direct `git commit` use in scripts/docs, and userland Poseidon/BN254 inside contracts. Fix any finding through a new failing regression test.

- [ ] **Step 4: Commit final handoff**

Commit message: `docs: hand off verified PoolPass backend`

## Plan self-review

- Spec coverage: Sections 0–14 map to Tasks 1–13; hard gates precede circuit/product work; self-serve, persistence, fallback proving, independent verify, real settlement, replay, docs, and commit-tree rules are explicit.
- Placeholder scan: no implementation item is deferred; generated IDs/hashes are produced only by the required live steps and never fabricated.
- Type consistency: public inputs remain `[root, amount, nullifier, epoch]`; proof is `A|B|C`; G2 is `c1|c0`; contract error 5 remains `NullifierUsed`; all addresses originate in `deployments.json`.
- Scope: depth three, mock SAC USDC, lightweight JSON persistence, and Phase-1 ceremony match the prompt's acceptable simplifications.
