import { readFile, writeFile } from "node:fs/promises";

import { serializeProof, serializePublicSignals } from "../src/serialization/groth16.ts";

const [proofPath, publicPath, outputPath] = process.argv.slice(2);
if (!proofPath || !publicPath || !outputPath) throw new Error("Usage: tsx merkle-tools/serialize_proof.js <proof.json> <public.json> <serialized.json>");
const proof = JSON.parse(await readFile(proofPath, "utf8"));
const publicSignals = JSON.parse(await readFile(publicPath, "utf8"));
await writeFile(outputPath, `${JSON.stringify({ proof: serializeProof(proof).toString("hex"), public_inputs: serializePublicSignals(publicSignals).map((value) => value.toString("hex")) }, null, 2)}\n`);
console.log(outputPath);
