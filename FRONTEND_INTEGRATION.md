# PoolPass frontend integration

This is the exact integration contract for the PoolPass testnet backend. `deployments.json` remains the machine-readable source of truth; the values below mirror its current contents for human use.

## Network and public identities

- Network: Stellar testnet, protocol 27
- RPC: `https://soroban-testnet.stellar.org`
- Passphrase: `Test SDF Network ; September 2015`
- Deployer: `GCWTZ6UTCS4UMLQVI4DB72A6KYCHEYWFQ7M42VP2RAPK2TUV5WESZLIW`
- Demo issuer: `GDCN6MQZWTZVPHG632RGUDAHHKXZN43XFFDKYTOFGE7PWAWA5REP5ISO`
- Fixture investor: `GCDJKMWI42NKQBYH4AC7RFKYS7A7YKJ3R7BHILOAEC2PF5VLE56BHHNK`

No secret is stored in this repository. Backend signing identities live in the local Stellar CLI keystore.

## Contracts

| Role | Contract ID | WASM hash |
| --- | --- | --- |
| PoolPass | `CA27AYHJ3IO4Y5W5BJEYLH5DUUKTICDBWFDYO2GFHXUM3NUCMSYZALKG` | `4b139585d99a77d6c40cee119a112d56f09bfdeb327174055f065ce676edd3ea` |
| Mock USDC | `CAX5YVXG6NQNCWKR5VANI7P7ZKGTAA2EUGWJY5WZZDEMNPFP6UI4KP77` | `1dc05ce4f6c7a49542947a0e2c945c39efdfca968470cb27bd50f5a547664c80` |
| Pool token | `CCNFOLFIALOOURBI7P5ULEHSYJSTXUUUYYK3Y662M2OPBMLVVD53LDEH` | `1dc05ce4f6c7a49542947a0e2c945c39efdfca968470cb27bd50f5a547664c80` |
| Poseidon parity gate | `CDBKFLR5W4I6G5BTFNHMOKKEIKWOGCP6ONPMPZJHPGM7GTAPAZVIFUWD` | `5a825f6cbc8c353bda86f3869b5029b0f82525877454be6048c6c8df0d4a96e8` |
| Groth16 parity gate | `CALDSMCD6MMSKWALAYR7WTQLGRJMAXYVPWVJLSK3RQM7NVZKWJEI6UFX` | `e64fd2cf01ed55de7e074a35f51d8d339c41244e6555086b58a20fd9301162dd` |

Mock USDC is a custom hackathon token with 7 decimals, not Circle USDC. Never present it as a real asset.

## PoolPass methods

The signatures below were downloaded from the deployed testnet contract with `stellar contract info interface`.

```text
initialize(
  issuer: Address,
  usdc_sac: Address,
  pool_token: Address,
  groth16_vk: Bytes,
  merkle_depth: u32,
  pool_name: String
) -> Result<(), Error>

update_accredited_set(
  issuer: Address,
  leaf_hashes: Vec<BytesN<32>>
) -> Result<BytesN<32>, Error>

subscribe(
  investor: Address,
  amount: i128,
  proof: Bytes,
  public_inputs: Vec<BytesN<32>>
) -> Result<BytesN<32>, Error> // returns commitment

get_pool_info() -> Result<PoolInfo, Error>
advance_epoch(issuer: Address) -> Result<u32, Error>
```

`PoolInfo` fields are `epoch`, `issuer`, `merkle_depth`, `merkle_root`, `per_investor_cap_public`, `pool_name`, `pool_token`, `total_subscribed`, and `usdc_sac`. The issuer must authorize set updates and epoch advances. The investor must authorize `subscribe` and its nested mock-USDC transfer.

Relevant mock-token calls are `balance(id: Address) -> i128`, `mint(to, amount)`, `transfer(from, to: MuxedAddress, amount)`, `decimals()`, `name()`, and `symbol()`. Only the demo issuer can mint mock USDC; only PoolPass can mint the pool token.

## Circuit and client-side secret flow

All field values are canonical BN254 Fr integers. Keep them as `bigint` or decimal strings—never JavaScript `number`.

```text
leaf       = Poseidon3(investor_id, cap, investor_secret)
nullifier  = Poseidon2(investor_secret, epoch)
commitment = Poseidon3(nullifier, amount, epoch)
```

The visitor generates `investor_id` and `investor_secret` locally. Send only the 32-byte lowercase hex `leaf` to `/accredit`. The private proof inputs are `investor_id`, `cap`, `investor_secret`, `merkle_path[3]`, and `merkle_indices[3]`. The public inputs are fixed, in this exact order:

```text
[merkle_root, amount, nullifier, epoch]
```

Each public value passed to Soroban is a separate 32-byte big-endian `BytesN<32>`. `amount` uses 7-decimal base units and is constrained to 64 bits. It is public: the commitment does not hide the amount.

## Groth16 byte layout

- G1: `x[32] || y[32]`
- G2: `x.c1[32] || x.c0[32] || y.c1[32] || y.c0[32]`
- Proof: `A G1 || B G2 || C G1`, exactly 256 bytes
- VK: `alpha G1 || beta G2 || gamma G2 || delta G2 || ic_len u32 BE || IC[]`
- Production `ic_len`: 5, because there are four public signals

snarkjs emits Fp2 as `[c0,c1]`; the serializer deliberately reverses each pair. Use `src/serialization/groth16.ts` or `merkle-tools/serialize_proof.js`. Full moduli and validation rules are in `docs/serialization.md`.

## Errors

| Code | Variant | Frontend message |
| ---: | --- | --- |
| 1 | `Unauthorized` | This wallet is not authorized for that issuer action. |
| 2 | `InvalidProof` | The zero-knowledge proof is invalid. |
| 3 | `RootMismatch` | Accreditation changed; request a fresh Merkle path and proof. |
| 4 | `EpochMismatch` | The subscription epoch changed; regenerate the nullifier and proof. |
| 5 | `NullifierUsed` | This investor already subscribed in the current epoch. |
| 6 | `AmountInvalid` | The amount is invalid or differs from the proof. |
| 7 | `PaymentFailed` | Mock-USDC settlement failed; obtain faucet funds and retry. |
| 8 | `NotInitialized` | Pool state is not initialized. |

Decode either `ContractError(n)` or `Error(Contract, #n)`. Wallet-auth failures can also be Soroban host authentication errors.

## Events

```text
RootUpdated { root, leaf_count, epoch(topic), timestamp }
Subscribed { investor(topic), amount, nullifier, commitment, epoch(topic), timestamp }
EpochAdvanced { epoch(topic), timestamp }
```

The indexer reads RPC `getEvents`, keeps only successful contract calls, deduplicates by event ID, and atomically persists its cursor and normalized events to `services/data/events.json`.

## HTTP API

Run locally with `pnpm api` (default `http://127.0.0.1:3000`). JSON bodies are strict; extra secret-bearing fields are rejected.

### `POST /accredit`

Request: `{ "leaf": "<64 lowercase hex>" }`.

Response: `{ leaf, root, epoch, index, merkle_path: string[3], merkle_indices: number[3] }`. `root` and paths are decimal field strings. The demo issuer pads unused slots with zero leaves and commits all eight leaves on-chain before returning. A later accreditation rotates the root/epoch, so generate the proof promptly or request a fresh path.

### `POST /faucet`

Request: `{ "address": "G...", "amount": "10000000000" }`. Amount is optional, in base units, and capped at 100,000,000,000 (10,000 mock USDC) per service window/address.

### `POST /prove`

Request: `{ "input": { ...all circuit signals... } }`. Response: `{ "proof": <snarkjs proof>, "publicSignals": string[4] }`. The primary privacy-preserving path should prove in-browser; this server path necessarily receives private inputs and is only a compatibility fallback.

### `POST /verify`

Request: `{ "proof": <snarkjs proof>, "publicSignals": string[4] }`. Response: `{ "valid": boolean }`. The server always uses the committed PoolPass VK and ignores caller key substitution by schema.

### `GET /pool/demo`

Returns live `PoolInfo` plus `{ id: "demo", contractId }`.

Operational checks: `pnpm api:smoke`, `pnpm selfserve:smoke`, and `pnpm indexer:once`.

## Gate evidence

- Poseidon parity: classic circomlib Poseidon over BN254 Fr, two-input `t=3/RF=8/RP=57`, three-input `t=4/RF=8/RP=56`. Forced host invocation: [94e5d8…e4d5](https://stellar.expert/explorer/testnet/tx/94e5d8b1a6161bea6581b305c522981d2674ac87db49bc6263126d7b3167e4d5).
- Native BN254 Groth16 verification: [593c25…0ee1](https://stellar.expert/explorer/testnet/tx/593c2516f1c8b431a0ff8cf09a82ba92eb467bfb0e6f1b72099bfb25d0490ee1).

No contract contains userland Poseidon or BN254 arithmetic.

## Live completion evidence

- Fixture root update: [bf68ed…8c8a](https://stellar.expert/explorer/testnet/tx/bf68edd1fca52e9ccd7c51e0cbc0e2819e2c7b937812e71678340b26f05a8c8a)
- Real subscription and exact balance assertions: [c0ed39…aa51](https://stellar.expert/explorer/testnet/tx/c0ed392e0aea922790676010e0a13e4a4d6f5de7b0878e1b08ae9d79b0bfaa51)
- Same-nullifier replay, finalized `FAILED`, decoded code 5: [9713c9…7a36](https://stellar.expert/explorer/testnet/tx/9713c9fe80bb3737e308580bee8f45619be5ef0620f2cd6953b781c2900d7a36)
- Leaf-only self-serve accreditation: [b8394e…28fd](https://stellar.expert/explorer/testnet/tx/b8394e5c4cb75db7689450c2fb96b979262b73241cacd5a310c3543746ca28fd)
- Fresh-address fallback-proof subscription: [a3950d…a0dd](https://stellar.expert/explorer/testnet/tx/a3950d75ec2203d33949d4c7c05ba72b78d638361598060f8b9eac91d3baa0dd)

The original exact transcript is in `docs/e2e-transcript.md`; all ledgers, full hashes, statuses, and explorer URLs are in `deployments.json`.
