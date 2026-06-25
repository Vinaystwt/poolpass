# PoolPass frontend integration

`deployments.json` is the machine-readable source of truth. This document mirrors the current Stellar testnet marketplace deployment for frontend and API integration.

## Network

- Network: Stellar testnet, protocol 27
- RPC: `https://soroban-testnet.stellar.org`
- Passphrase: `Test SDF Network ; September 2015`
- Deployer: `GCWTZ6UTCS4UMLQVI4DB72A6KYCHEYWFQ7M42VP2RAPK2TUV5WESZLIW`

No secret key is stored in this repository. Backend signing identities live in the local Stellar CLI keystore.

## Shared contracts

| Role | Contract ID | WASM hash |
| --- | --- | --- |
| Mock USDC | `CAX5YVXG6NQNCWKR5VANI7P7ZKGTAA2EUGWJY5WZZDEMNPFP6UI4KP77` | `1dc05ce4f6c7a49542947a0e2c945c39efdfca968470cb27bd50f5a547664c80` |
| Poseidon parity gate | `CDBKFLR5W4I6G5BTFNHMOKKEIKWOGCP6ONPMPZJHPGM7GTAPAZVIFUWD` | `5a825f6cbc8c353bda86f3869b5029b0f82525877454be6048c6c8df0d4a96e8` |
| Groth16 parity gate | `CALDSMCD6MMSKWALAYR7WTQLGRJMAXYVPWVJLSK3RQM7NVZKWJEI6UFX` | `e64fd2cf01ed55de7e074a35f51d8d339c41244e6555086b58a20fd9301162dd` |

Mock USDC is a custom testnet token with 7 decimals, not Circle USDC. Never present it as a real asset.

## Pools

The registry exposes a top-level `pools` array. Each pool has its own PoolPass contract, pool token, issuer, Merkle root, and public cap. All three use the same Mock USDC and the same depth-3 verified circuit/VK. Pool C uses option (b): the verified circuit is compiled as `PoolPass(3)`, so the stricter tier is represented by issuer membership policy rather than a depth-4 VK variant.

| ID | Name | PoolPass | Pool token | Depth / leaves | Public cap | Gate |
| --- | --- | --- | --- | ---: | ---: | --- |
| `open-access` | Open Access Pool | `CBVARDGOKLVCJ7ZAHETHH7GZIP35FQDQBTGK4J4PLLBXKRHU6SM7K2FV` | `CBUXSNRSN3UC5FVGK6MNE4FBJ5LJVWHWQZPZB3MJ4PXX6M73UBVY2KWC` | 3 / 8 | `100000000000` | Two seeded investors plus zero padding; base membership proof with a generous cap. |
| `capped-allocation` | Capped Allocation Pool | `CDTQLM2IQG7SCRAZDKCCLCCOZMEICMQG4FYUCJEOJ6G7QPK7CTVDODMX` | `CCV6IPCIQUNVCU273RGIUG34AOFWY275BYXWVKW7Q5K3BDQB7NW7REKP` | 3 / 8 | `25000000000` | Tighter public cap; over-cap amounts fail in the existing proof path. |
| `accredited-tier` | Accredited Tier Pool | `CD7AKD77JQ3C2GKQLVGUN5CEV447XWIM4772DLQFJAZ3TJ5NFTRIFII5` | `CDG4XLAWTH2U7UCBIPMAPZEK3RUEHNBPGULM6EEWDS6F7XKLSHOLTHGR` | 3 / 8 | `250000000000` | All eight leaves seeded; stricter tier by issuer membership policy. |

There is no APY, yield, asset-class, tenor, or strategy field. The frontend must not invent or display one.

## PoolPass methods

The only contract-interface change from the original demo is the final additive initializer argument:

```text
initialize(
  issuer: Address,
  usdc_sac: Address,
  pool_token: Address,
  groth16_vk: Bytes,
  merkle_depth: u32,
  pool_name: String,
  per_investor_cap_public: Option<i128>
) -> Result<(), Error>
```

`per_investor_cap_public` is a display/eligibility value surfaced in `PoolInfo`. The contract does not add a new cap check in `subscribe`; `amount <= cap` remains enforced by the existing circuit proof.

Other methods:

```text
update_accredited_set(issuer: Address, leaf_hashes: Vec<BytesN<32>>) -> Result<BytesN<32>, Error>
subscribe(investor: Address, amount: i128, proof: Bytes, public_inputs: Vec<BytesN<32>>) -> Result<BytesN<32>, Error>
get_pool_info() -> Result<PoolInfo, Error>
advance_epoch(issuer: Address) -> Result<u32, Error>
```

`PoolInfo` fields are `epoch`, `issuer`, `merkle_depth`, `merkle_root`, `per_investor_cap_public`, `pool_name`, `pool_token`, `total_subscribed`, and `usdc_sac`.

## Circuit and proof flow

All field values are canonical BN254 Fr integers. Keep them as `bigint` or decimal strings.

```text
leaf       = Poseidon3(investor_id, cap, investor_secret)
nullifier  = Poseidon2(investor_secret, epoch)
commitment = Poseidon3(nullifier, amount, epoch)
```

The public inputs are fixed in this exact order:

```text
[merkle_root, amount, nullifier, epoch]
```

Each public value passed to Soroban is a separate 32-byte big-endian `BytesN<32>`. `amount` uses 7-decimal base units and is constrained to 64 bits. It is public.

The private proof inputs are `investor_id`, `cap`, `investor_secret`, `merkle_path[3]`, and `merkle_indices[3]`. The visitor should send only the 32-byte lowercase hex `leaf` to `/accredit`.

## Events

PoolPass emits:

```text
RootUpdated { root, leaf_count, epoch(topic), timestamp }
Subscribed { investor(topic), amount, nullifier, commitment, epoch(topic), timestamp }
EpochAdvanced { epoch(topic), timestamp }
```

For Soroban RPC `getEvents`, filter by `type: "contract"`, all PoolPass contract IDs from `deployments.pools[*].contractId`, and the encoded first topic. Encode the event-name symbol with `nativeToScVal(name, { type: "symbol" }).toXDR("base64")`.

The indexer keeps successful contract calls, deduplicates by event ID, tags each normalized event with `poolId`, and persists to `services/data/events.json`.

`GET /api/events` returns:

```ts
{
  cursor?: number,
  events: Array<{
    id: string,
    name: "subscribed" | "root_updated" | "epoch_advanced",
    poolId?: string,
    contractId: string,
    txHash: string,
    ledger: number,
    closedAt: string,
    epoch?: number,
    data: object
  }>,
  source: "live" | "snapshot",
  isStale: boolean,
  lastLedger: number | null,
  note?: string
}
```

The live route clamps `startLedger` to the RPC retention window. If live scanning fails, it returns the freshest local snapshot with `isStale: true`; it no longer serves a frozen snapshot as if it were live.

## HTTP API

Run locally with `pnpm api` on `http://127.0.0.1:3000`. JSON bodies are strict; extra secret-bearing fields are rejected.

### `POST /accredit`

Request: `{ "leaf": "<64 lowercase hex>" }`.

Response: `{ leaf, root, epoch, index, merkle_path: string[3], merkle_indices: number[3] }`. The default API accreditation path targets the first configured pool.

### `POST /faucet`

Request: `{ "address": "G...", "amount": "10000000000" }`. Amount is optional, in base units, and capped at 100,000,000,000 per service window/address.

### `POST /prove`

Request: `{ "input": { ...all circuit signals... } }`. Response: `{ "proof": <snarkjs proof>, "publicSignals": string[4] }`. This is a compatibility fallback; the intended privacy path proves in-browser.

### `POST /verify`

Request: `{ "proof": <snarkjs proof>, "publicSignals": string[4] }`. Response: `{ "valid": boolean }`.

### `GET /pool/:id`

`id` may be any pool ID from `deployments.pools` or a PoolPass contract ID. The legacy `/pool/demo` alias resolves to the first pool.

Returns:

```ts
{
  id: string,
  name: string,
  gateDescription: string,
  contractId: string,
  poolToken: string,
  issuer: string,
  vk: string,
  merkleDepth: number,
  leafCount: number,
  perInvestorCapPublic: string,
  totalSubscribed: string,
  epoch: number,
  currentRoot: string,
  subscriberCount: number,
  subscribedVolume: string
}
```

### `GET /pools`

Returns `{ pools: PoolCard[] }` using the same shape as `GET /pool/:id`. This is the preferred marketplace bootstrap route. The Next app also exposes `GET /api/pools` as a proxy.

Operational checks: `pnpm api:smoke`, `pnpm selfserve:smoke`, and `pnpm indexer:once`.

## Gate evidence

- Gate A Poseidon parity: `pnpm gate:a` returned identical off-chain, circuit, and on-chain values: `7853200120776062878684798364095072458815029376092732009249414926327459813530`.
- Gate B Groth16 verification: `pnpm gate:b` returned `snarkjs=OK!` and `onchain=true`.
- The PoolPass Poseidon code, Groth16 verifier, circuit, VK, and proof serialization were not changed.

## Live marketplace evidence

- Open Access root update: [c7c243…b22a](https://stellar.expert/explorer/testnet/tx/c7c243144206815c48bf0c1c64e96eab067e0182ac9f82e2f05b4464611fb22a)
- Open Access subscription: [7d11c5…3e08a](https://stellar.expert/explorer/testnet/tx/7d11c50dd9b1238cfcd2222ff3f01f40d63f05e099ccc4b855f1ffa7eab3e08a)
- Capped Allocation root update: [0812f9…c47e](https://stellar.expert/explorer/testnet/tx/0812f94c813944f478e30c7f75d9597b51c86f6ce52690fb4069b38956e7c47e)
- Capped Allocation subscription: [7a5507…2e5f](https://stellar.expert/explorer/testnet/tx/7a5507103998e6675b7a0b83959ef6d3fb00efba96eb4acdc849efaa13582e5f)
- Accredited Tier root update: [7f7b7…5a53](https://stellar.expert/explorer/testnet/tx/7f7b7f0c4aea20da4472df837a71eb25f445975f7c53a1369f36d3b694415a53)
- Accredited Tier subscription: [e40480…4330](https://stellar.expert/explorer/testnet/tx/e40480c7fc7f4a51b415977970d70d76a1708ffb69c4ba7731c73b7a41ed4330)
- Marketplace self-serve subscription surfaced by `/api/events` live merge in 5.7 seconds: [9a62ab…a517](https://stellar.expert/explorer/testnet/tx/9a62ab346ee17713270320b8010191fed25f03ec2ab37a888b5bc7ca8fbaa517)

Full hashes, ledgers, statuses, and explorer URLs are in `deployments.json`.
