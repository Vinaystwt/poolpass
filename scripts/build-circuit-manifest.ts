import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const artifacts = [
  "circuits/build/poolpass/poolpass.r1cs",
  "circuits/build/poolpass/poolpass_js/poolpass.wasm",
  "circuits/build/poolpass/poolpass_final.zkey",
  "circuits/verification_key.json",
  "circuits/proof.json",
  "circuits/public.json",
  "circuits/serialized-proof.json",
] as const;

const hashes: Record<string, { sha256: string; bytes: number }> = {};
for (const path of artifacts) {
  const bytes = await readFile(resolve(root, path));
  hashes[path] = { sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length };
}
await writeFile(
  resolve(root, "circuits/artifact-manifest.json"),
  `${JSON.stringify({ circuit: "poolpass", circom: "2.2.2", snarkjs: "0.7.6", curve: "bn128", protocol: "groth16", publicInputOrder: ["merkle_root", "amount", "nullifier", "epoch"], artifacts: hashes }, null, 2)}\n`,
);
