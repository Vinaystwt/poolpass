# Gate B — dummy Groth16 verification

Status: **PASS** on Stellar testnet, Protocol 27.

The one-constraint Circom circuit proves private `a=3` and `b=11` satisfy public `c=33`. snarkjs 0.7.6 generated and independently verified a BN254 Groth16 proof. The Soroban contract adapted Stellar's canonical verifier equation to SDK 26.1.0 BN254 types:

```text
vk_x = IC[0] + Σ public[i] * IC[i+1]
e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1
```

Every G1 multiplication/addition and the final four-pair check uses `env.crypto().bn254()` native host functions. There is no arkworks or userland curve implementation in the contract.

Contract: `CALDSMCD6MMSKWALAYR7WTQLGRJMAXYVPWVJLSK3RQM7NVZKWJEI6UFX`.

Testnet evidence:

- WASM upload: [67392e0a550204009a3095cdcaa1d9a7a73b1ef772d6c987df8bd86a2b02c2dd](https://stellar.expert/explorer/testnet/tx/67392e0a550204009a3095cdcaa1d9a7a73b1ef772d6c987df8bd86a2b02c2dd), ledger 3244136.
- Contract deployment: [ed6fe6bebfda8461134c564ddec233313ab3be79d68720dba9e14b5c394018d4](https://stellar.expert/explorer/testnet/tx/ed6fe6bebfda8461134c564ddec233313ab3be79d68720dba9e14b5c394018d4), ledger 3244138.
- Successful forced verification: [593c2516f1c8b431a0ff8cf09a82ba92eb467bfb0e6f1b72099bfb25d0490ee1](https://stellar.expert/explorer/testnet/tx/593c2516f1c8b431a0ff8cf09a82ba92eb467bfb0e6f1b72099bfb25d0490ee1), ledger 3244148, returned `true`.

Unit evidence additionally verifies that changing public `c` from 33 to 22 returns `false` with the same proof.

Canonical sources used:

- [Stellar canonical Groth16 example](https://github.com/stellar/soroban-examples/tree/main/groth16_verifier)
- [SDK 26.1.0 BN254 serialization and pairing API](https://docs.rs/soroban-sdk/26.1.0/soroban_sdk/crypto/bn254/)

Run `bash circuits/scripts/setup-gate-b.sh` to regenerate and verify the proof, then `pnpm gate:b` to check serialization and the deployed verifier.
