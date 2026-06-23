#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
BUILD="$ROOT/circuits/build/poolpass"
PTAU="$ROOT/circuits/build/powersOfTau28_hez_final_12.ptau"
SNARKJS=(pnpm --dir "$ROOT" exec snarkjs)

mkdir -p "$BUILD"
"$ROOT/.tools/bin/circom" "$ROOT/circuits/poolpass.circom" --r1cs --wasm --sym -o "$BUILD"
cp "$ROOT/circuits/scripts/commonjs-package.json" "$BUILD/poolpass_js/package.json"
"${SNARKJS[@]}" r1cs info "$BUILD/poolpass.r1cs"

if [[ ! -f "$PTAU" ]]; then
  "${SNARKJS[@]}" powersoftau new bn128 12 "$BUILD/pot12_0000.ptau"
  "${SNARKJS[@]}" powersoftau contribute "$BUILD/pot12_0000.ptau" "$BUILD/pot12_0001.ptau" --name="PoolPass demo contribution" -e="PoolPass Stellar Hacks 2026 Phase 1 ceremony"
  "${SNARKJS[@]}" powersoftau prepare phase2 "$BUILD/pot12_0001.ptau" "$PTAU"
fi

"${SNARKJS[@]}" groth16 setup "$BUILD/poolpass.r1cs" "$PTAU" "$BUILD/poolpass_0000.zkey"
"${SNARKJS[@]}" zkey contribute "$BUILD/poolpass_0000.zkey" "$BUILD/poolpass_final.zkey" --name="PoolPass circuit contribution" -e="PoolPass production-circuit demo contribution"
"${SNARKJS[@]}" zkey export verificationkey "$BUILD/poolpass_final.zkey" "$ROOT/circuits/verification_key.json"
