# PoolPass Groth16 serialization

All integers are unsigned, canonical, fixed-width, 32-byte big-endian values. No compressed point flags are used.

## Fields

- BN254 base field `Fp` modulus (point coordinates): `21888242871839275222246405745257275088696311157297823662689037894645226208583`.
- BN254 scalar field `Fr` modulus (public inputs): `21888242871839275222246405745257275088548364400416034343698204186575808495617`.
- A coordinate or signal greater than or equal to its modulus is rejected before contract invocation.

## Points

- G1 is 64 bytes: `x[32] || y[32]`.
- G2 is 128 bytes: `x.c1[32] || x.c0[32] || y.c1[32] || y.c0[32]`.

snarkjs emits each Fp2 coordinate as `[c0, c1]`. Soroban SDK 26.1.0 requires the Ethereum-compatible Fp2 byte order `c1 || c0`, so each pair is deliberately reversed during serialization. This ordering was confirmed by the passing native BN254 testnet verifier transaction.

## Proof

The proof argument is exactly 256 bytes:

```text
A G1 (64) || B G2 (128) || C G1 (64)
```

## Verification key

The verification-key argument is:

```text
alpha G1 (64)
|| beta G2 (128)
|| gamma G2 (128)
|| delta G2 (128)
|| ic_len u32 big-endian (4)
|| IC[0] G1 (64) || ... || IC[ic_len-1] G1 (64)
```

Total length is `452 + 64 * ic_len` bytes. A key is rejected unless `ic_len == public_inputs.length + 1` and the byte length is exact.

## Public inputs

Each public input is a separate `BytesN<32>` containing one canonical BN254 Fr value. The dummy Gate-B circuit has `[c]`. The production PoolPass ordering is fixed as:

```text
[merkle_root, amount, nullifier, epoch]
```

The TypeScript reference implementation is `src/serialization/groth16.ts`; the Rust decoder/equation proven on testnet is `contracts/gate-groth16/src/lib.rs`.

