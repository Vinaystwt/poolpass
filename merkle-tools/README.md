# PoolPass Merkle tools

These thin CLIs all import the same `src/crypto/poseidon.ts` implementation proven by Gate A. Decimal strings are used in JSON so field values survive JavaScript transport without precision loss.

```bash
pnpm exec tsx merkle-tools/build_tree.js circuits/fixtures/investors.csv circuits/fixtures/tree.json
pnpm exec tsx merkle-tools/generate_path.js circuits/fixtures/tree.json <leaf-decimal> circuits/fixtures/proof-package.json
pnpm exec tsx merkle-tools/serialize_proof.js circuits/proof.json circuits/public.json circuits/serialized-proof.json
```

At each level, `merkle_indices[i] = 0` means the current node is left; `1` means it is right.
