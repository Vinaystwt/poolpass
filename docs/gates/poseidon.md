# Gate A — Poseidon parameter parity

Status: **PASS** on Stellar testnet, Protocol 27.

PoolPass uses classic Poseidon over BN254 Fr through `soroban-poseidon` 26.0.0. The helper calls CAP-0075's native `crypto_hazmat().poseidon_permutation`; it does not implement Poseidon in contract WASM.

Parameters:

- Two-input node/nullifier hash: `t=3`, capacity `0`, rate `2`, S-box degree `5`, `RF=8`, `RP=57`, circomlib BN254 MDS matrix and round constants, output `state[0]`.
- Three-input leaf/commitment hash: `t=4`, capacity `0`, rate `3`, S-box degree `5`, `RF=8`, `RP=56`, circomlib BN254 MDS matrix and round constants, output `state[0]`.
- BN254 Fr modulus: `21888242871839275222246405745257275088548364400416034343698204186575808495617`.

Fixed vector `Poseidon([1,2])`:

```text
decimal: 7853200120776062878684798364095072458815029376092732009249414926327459813530
hex:     115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a
```

The value matched in all three environments:

1. `circomlibjs` 0.1.7 in `src/crypto/poseidon.ts`.
2. Circom 2.2.2 + circomlib 2.0.5 `Poseidon(2)` in `circuits/gates/poseidon_pair.circom` (517 constraints; output witness index 1).
3. `soroban-poseidon` 26.0.0 in `contracts/gate-poseidon`, deployed as `CDBKFLR5W4I6G5BTFNHMOKKEIKWOGCP6ONPMPZJHPGM7GTAPAZVIFUWD`.

Testnet evidence:

- WASM upload: [36b07715ff3a8e8c2addebf61ff18f5205368468fcd5ad2d675718243077af36](https://stellar.expert/explorer/testnet/tx/36b07715ff3a8e8c2addebf61ff18f5205368468fcd5ad2d675718243077af36), ledger 3243896.
- Contract deployment: [ab6b8d95e5f1730a4f6ab49c35537daea94b84238d2eefb16f48a180bb482062](https://stellar.expert/explorer/testnet/tx/ab6b8d95e5f1730a4f6ab49c35537daea94b84238d2eefb16f48a180bb482062), ledger 3243965.
- Forced on-chain invocation: [94e5d8b1a6161bea6581b305c522981d2674ac87db49bc6263126d7b3167e4d5](https://stellar.expert/explorer/testnet/tx/94e5d8b1a6161bea6581b305c522981d2674ac87db49bc6263126d7b3167e4d5), ledger 3244062.

Canonical sources used:

- [CAP-0075](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0075.md)
- [Stellar soroban-poseidon](https://github.com/stellar/rs-soroban-poseidon/tree/v26.0.0)
- [Stellar SDK Poseidon API](https://docs.rs/soroban-sdk/26.1.0/soroban_sdk/crypto/struct.CryptoHazmat.html)

Re-run the local/circuit/chain assertion with `pnpm gate:a` after generating the witness.
