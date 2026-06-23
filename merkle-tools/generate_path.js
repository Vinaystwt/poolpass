import { readFile, writeFile } from "node:fs/promises";

const [treePath, targetLeaf, outputPath] = process.argv.slice(2);
if (!treePath || !targetLeaf || !outputPath) throw new Error("Usage: tsx merkle-tools/generate_path.js <tree.json> <leaf-decimal> <proof-package.json>");

const tree = JSON.parse(await readFile(treePath, "utf8"));
const index = tree.leaves.indexOf(BigInt(targetLeaf).toString());
if (index < 0) throw new Error("Target leaf is not in the tree");
const siblings = [];
const indices = [];
let cursor = index;
for (let level = 0; level < 3; level += 1) {
  siblings.push(tree.levels[level][cursor ^ 1]);
  indices.push(cursor & 1);
  cursor >>= 1;
}
await writeFile(outputPath, `${JSON.stringify({ leaf: tree.leaves[index], root: tree.root, index, merkle_path: siblings, merkle_indices: indices }, null, 2)}\n`);
console.log(outputPath);
