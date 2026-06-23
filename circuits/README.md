# PoolPass circuit

The production circuit is `poolpass.circom`, compiled with Circom 2.2.2 and circomlib 2.0.5. Proofs use snarkjs 0.7.6, Groth16, and BN254 (`bn128` in snarkjs). The demo tree depth is fixed at 3; the template itself accepts a depth parameter.

Public signals are ordered exactly as:

1. `merkle_root`
2. `amount`
3. `nullifier`
4. `epoch`

Private signals are `investor_id`, `cap`, `investor_secret`, `merkle_path[3]`, and `merkle_indices[3]`. Amount and cap are constrained by a 64-bit `LessEqThan` gadget.

## Build and prove

```bash
./circuits/scripts/build-poolpass.sh
./circuits/scripts/prove-example.sh
```

This creates the R1CS, witness WASM, proving key, known-good proof, public vector, verification key, and `artifact-manifest.json`. Large generated proving artifacts remain ignored; their exact local SHA-256 digests and sizes are recorded in the manifest.

## Ceremony warning

The scripts perform a single-contributor Phase-1-style hackathon ceremony. This is acceptable for the testnet demo but not production: a production launch needs a multi-party ceremony with independently contributed entropy and published transcripts.
