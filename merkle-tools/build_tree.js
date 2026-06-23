import { readFile, writeFile } from "node:fs/promises";

import { buildTree, treeToJson } from "../src/merkle/tree.ts";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error("Usage: tsx merkle-tools/build_tree.js <investors.csv> <tree.json>");

const lines = (await readFile(inputPath, "utf8")).trim().split(/\r?\n/);
const header = lines.shift()?.split(",");
if (header?.join(",") !== "investor_id,cap,investor_secret") throw new Error("Expected CSV header investor_id,cap,investor_secret");
const records = lines.map((line, index) => {
  const values = line.split(",");
  if (values.length !== 3) throw new Error(`Invalid CSV row ${index + 2}`);
  return { investorId: values[0], cap: values[1], investorSecret: values[2] };
});
const tree = await buildTree(records);
await writeFile(outputPath, `${JSON.stringify(treeToJson(tree), null, 2)}\n`);
console.log(tree.root.toString());
