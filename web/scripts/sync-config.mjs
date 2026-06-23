// Keeps web/lib/deployments.json in lockstep with the canonical repo-root
// deployments.json — the single machine-readable source of truth. Runs on
// predev / prebuild so the frontend never drifts from on-chain reality.
// Deploy-safe: the copy lives inside web/ so Vercel (rooted at web/) ships it.
import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "../../deployments.json");
const dest = resolve(here, "../lib/deployments.json");

if (!existsSync(source)) {
  // On Vercel the repo root may not be present; the committed copy is canonical there.
  console.warn(`[sync-config] canonical ${source} not found; using committed copy.`);
  process.exit(0);
}
copyFileSync(source, dest);
console.log(`[sync-config] synced deployments.json -> ${dest}`);

// Also snapshot the indexer events so the deployed frontend has a starting state.
const eventsSrc = resolve(here, "../../services/data/events.json");
const eventsDest = resolve(here, "../lib/events-snapshot.json");
if (existsSync(eventsSrc)) {
  copyFileSync(eventsSrc, eventsDest);
  console.log(`[sync-config] synced events.json -> ${eventsDest}`);
}
