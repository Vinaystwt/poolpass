#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
BIN="$ROOT/.tools/bin/circom"

if [[ -x "$BIN" ]] && [[ "$($BIN --version)" == "circom compiler 2.2.2" ]]; then
  exit 0
fi

mkdir -p "$ROOT/.tools"
cargo install \
  --git https://github.com/iden3/circom.git \
  --tag v2.2.2 \
  --locked \
  --root "$ROOT/.tools" \
  circom
