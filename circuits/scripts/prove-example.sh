#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
BUILD="$ROOT/circuits/build/poolpass"
SNARKJS=(pnpm --dir "$ROOT" exec snarkjs)

node "$BUILD/poolpass_js/generate_witness.js" "$BUILD/poolpass_js/poolpass.wasm" "$ROOT/circuits/example_input.json" "$BUILD/example.wtns"
"${SNARKJS[@]}" groth16 prove "$BUILD/poolpass_final.zkey" "$BUILD/example.wtns" "$ROOT/circuits/proof.json" "$ROOT/circuits/public.json"
"${SNARKJS[@]}" groth16 verify "$ROOT/circuits/verification_key.json" "$ROOT/circuits/public.json" "$ROOT/circuits/proof.json"
pnpm --dir "$ROOT" exec tsx "$ROOT/merkle-tools/serialize_proof.js" "$ROOT/circuits/proof.json" "$ROOT/circuits/public.json" "$ROOT/circuits/serialized-proof.json"
pnpm --dir "$ROOT" exec tsx "$ROOT/scripts/build-circuit-manifest.ts"
