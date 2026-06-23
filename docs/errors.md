# PoolPass contract errors

These numeric codes are stable frontend API. Soroban reports them as `ContractError(<code>)`.

| Code | Variant | Meaning |
| ---: | --- | --- |
| 1 | `Unauthorized` | The supplied actor is not the configured issuer, or initialization was already locked. |
| 2 | `InvalidProof` | Native BN254 Groth16 verification failed or proof/VK bytes are malformed. |
| 3 | `RootMismatch` | The proof root differs from storage, or an accredited-set leaf count does not match the configured depth. |
| 4 | `EpochMismatch` | The proof epoch differs from the current pool epoch. |
| 5 | `NullifierUsed` | This epoch-scoped nullifier has already subscribed. |
| 6 | `AmountInvalid` | Amount is non-positive, cannot be represented safely, or differs from the proof's public amount. |
| 7 | `PaymentFailed` | Token settlement or minting failed; the invocation is atomic. |
| 8 | `NotInitialized` | Pool state was read before `initialize`. |

An address authorization failure raised by `require_auth` is a Soroban host authentication error. Calls that supply a different issuer address return code 1 before attempting auth.
