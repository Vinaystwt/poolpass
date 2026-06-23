# PoolPass testnet e2e transcript

- Root update: bf68edd1fca52e9ccd7c51e0cbc0e2819e2c7b937812e71678340b26f05a8c8a (https://stellar.expert/explorer/testnet/tx/bf68edd1fca52e9ccd7c51e0cbc0e2819e2c7b937812e71678340b26f05a8c8a)
- Subscription: c0ed392e0aea922790676010e0a13e4a4d6f5de7b0878e1b08ae9d79b0bfaa51 (https://stellar.expert/explorer/testnet/tx/c0ed392e0aea922790676010e0a13e4a4d6f5de7b0878e1b08ae9d79b0bfaa51)
- Replay: 9713c9fe80bb3737e308580bee8f45619be5ef0620f2cd6953b781c2900d7a36, finalized FAILED, decoded ContractError(5) NullifierUsed (https://stellar.expert/explorer/testnet/tx/9713c9fe80bb3737e308580bee8f45619be5ef0620f2cd6953b781c2900d7a36)
- Amount: 25000000000 base units
- Investor USDC after: 75000000000
- Escrow USDC after: 25000000000
- Investor pool tokens after: 25000000000

## Self-serve path

- Leaf-only accreditation/root update: https://stellar.expert/explorer/testnet/tx/b8394e5c4cb75db7689450c2fb96b979262b73241cacd5a310c3543746ca28fd
- Faucet: https://stellar.expert/explorer/testnet/tx/ad4110781978eff5b119234fec3d2ca00a0c0ab48902976ba921ba882bbdb58e
- Fresh-address fallback-proof subscription: https://stellar.expert/explorer/testnet/tx/a3950d75ec2203d33949d4c7c05ba72b78d638361598060f8b9eac91d3baa0dd

The self-serve service received only the client-computed leaf. The investor ID, cap, and secret were supplied only to the fallback prover for this smoke test; the primary browser path keeps them client-side.
