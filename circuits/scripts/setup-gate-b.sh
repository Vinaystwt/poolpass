#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
BUILD="$ROOT/circuits/build/gate-b"
CIRCOM="$ROOT/.tools/bin/circom"
SNARKJS="$ROOT/node_modules/.bin/snarkjs"

mkdir -p "$BUILD"

"$CIRCOM" "$ROOT/circuits/gates/multiplier.circom" --r1cs --wasm --sym -o "$BUILD"

if [[ ! -f "$BUILD/pot8_final.ptau" ]]; then
  "$SNARKJS" powersoftau new bn128 8 "$BUILD/pot8_0000.ptau" -v
  "$SNARKJS" powersoftau contribute "$BUILD/pot8_0000.ptau" "$BUILD/pot8_0001.ptau" \
    --name="PoolPass Gate B" \
    -e="poolpass-gate-b-phase-one-testnet-2026-06-23"
  "$SNARKJS" powersoftau prepare phase2 "$BUILD/pot8_0001.ptau" "$BUILD/pot8_final.ptau"
fi

"$SNARKJS" groth16 setup "$BUILD/multiplier.r1cs" "$BUILD/pot8_final.ptau" "$BUILD/multiplier_0000.zkey"
"$SNARKJS" zkey contribute "$BUILD/multiplier_0000.zkey" "$BUILD/multiplier_final.zkey" \
  --name="PoolPass Gate B phase two" \
  -e="poolpass-gate-b-phase-two-testnet-2026-06-23"
"$SNARKJS" zkey export verificationkey "$BUILD/multiplier_final.zkey" "$BUILD/verification_key.json"
"$SNARKJS" groth16 fullprove \
  "$ROOT/circuits/gates/multiplier_input.json" \
  "$BUILD/multiplier_js/multiplier.wasm" \
  "$BUILD/multiplier_final.zkey" \
  "$BUILD/proof.json" \
  "$BUILD/public.json"
"$SNARKJS" groth16 verify "$BUILD/verification_key.json" "$BUILD/public.json" "$BUILD/proof.json"
