# PoolPass frontend

The user-facing app for PoolPass — zero-knowledge gated real-world-asset subscriptions on Stellar testnet. Built in one pass against `FRONTEND_INTEGRATION.md` and `deployments.json`.

**Narrative spine:** Prove you qualify. Reveal nothing.

## Run it

```bash
# 1 · backend services (from repo root) — holds the issuer key, serves /accredit, /faucet, /verify, /prove, /pool/demo
pnpm api                 # http://127.0.0.1:3000

# 2 · this frontend
cd web
npm install
npm run dev              # http://localhost:3000 (predev syncs deployments.json -> lib/)
```

`/accredit` and `/faucet` proxy to the running backend (only the demo issuer can commit roots / mint). In-browser proving and the verify page work without the backend.

## Definition-of-done flow (one device)

`/` → `/invest` → **Accredit** (self-serve, leaf-only) → **Prove** (in-browser, VERIFIED LOCALLY) → **Subscribe** (Freighter) → `/verify/[tx]` (independent verification).

## Stack — pinned versions

| Area | Package | Version |
|---|---|---|
| Framework | next / react / react-dom | 14.2.18 / 18 / 18 |
| Language | typescript | 5 (strict) |
| Styling | tailwindcss | 3.4.x |
| Primitives | @radix-ui/react-{dialog,tabs,tooltip,progress,slot} | 1.1.2 / 1.1.1 / 1.1.3 / 1.1.0 / 1.1.0 |
| Variants | class-variance-authority / clsx / tailwind-merge | 0.7.1 / 2.1.1 / 2.5.5 |
| Icons | lucide-react | 0.460.0 |
| Toast | sonner | 1.7.0 |
| Motion | framer-motion | 11.11.9 |
| State | zustand | 4.5.5 |
| Data | @tanstack/react-query | 5.59.16 |
| ZK | snarkjs / circomlibjs | 0.7.6 / 0.1.7 |
| Stellar | @stellar/stellar-sdk / @stellar/freighter-api | 16.0.1 / 4.1.0 |
| Charts | recharts | 2.13.3 |
| Forms | react-hook-form / @hookform/resolvers / zod | 7.53.2 / 3.9.1 / 3.23.8 |
| Polyfill | buffer | 6.0.3 |

> `@stellar/stellar-sdk` is **16.0.1** (not 13.x): 13 cannot parse protocol-27 transaction meta (`Bad union switch: 4`), which the verify page needs to reconstruct proofs from chain.

## Design tokens — pulled from DESIGN.md

Stripe `DESIGN.md` is applied verbatim as CSS variables in `app/globals.css` and mapped in `tailwind.config.ts`. The one PoolPass addition is `--accent-proof`, reserved for proof/verification UI.

**Light theme**

```
--canvas #ffffff   --canvas-soft #f6f9fc   --canvas-cream #f5e9d4   --card #ffffff
--hairline #e3e8ee --hairline-input #a8c3de
--ink #0d253d      --ink-secondary #273951 --ink-mute #64748d       --on-primary #ffffff
--primary #533afd  --primary-deep #4434d4   --primary-press #2e2b8c  --primary-soft #665efd
--primary-subdued #b9b9f9   --brand-dark #1c1e54
--accent-proof #7c5cff   --accent-proof-soft rgba(124,92,255,0.22)
ruby #ea2261  magenta #f96bee  lemon #9b6829
```

**Dark theme** (purpose-built, not inverted): `--canvas #0a0e1f`, `--card #121935`, `--ink #e9eefb`, `--primary #7b74ff`, `--accent-proof #9d8bff`, etc.

**Type scale** (DESIGN.md, weight 300 display, negative tracking): `display-xxl 56/−1.4`, `display-xl 48/−0.96`, `display-lg 32/−0.64`, `display-md 26/−0.26`, `heading-lg 22`, `body-md 15`, `body-tabular 14 (tnum)`. Inter substitutes Sohne at weight 300 with `ss01` globally; `tnum` on every money/numeric cell. Spacing 2/4/8/12/16/24/32/64. Radius pill 9999 on all buttons.

## Architecture decisions

- **`web/` subdirectory.** Keeps the backend pnpm/Rust workspace untouched. `scripts/sync-config.mjs` copies `../deployments.json` → `lib/deployments.json` on `predev`/`prebuild` so the single source of truth never drifts and Vercel (rooted at `web/`) ships it.
- **Single source of truth.** Every contract id, byte layout, public-input order, error code, and endpoint comes through `lib/backend-config.ts`. No backend value is hardcoded in components.
- **In-browser proving is the default.** snarkjs runs in a Web Worker (`lib/zk/prover.worker.ts`), genuine 3-stage witness → prove → verify. The `/prove` HTTP path is a labeled fallback behind an explicit privacy warning, per the disclosure in `FRONTEND_INTEGRATION.md`.
- **Verify page reconstructs from chain.** `/api/tx-proof/[hash]` decodes the proof + public inputs from the subscribe transaction's invocation args, so anyone can verify any subscription with no prior session state. `/api/verify` proxies the backend (server-side snarkjs hangs in the Next runtime; ffjavascript worker spawn).
- **Bundle splitting.** The proof console is `dynamic(ssr:false)` on the landing; poseidon-free decode helpers are split out so `/verify` stays light. Result: `/` 232 kB, `/verify` 122 kB first-load (vs ~1.6 MB for the prover-bearing `/invest`, `/prove`).
- **Diagrams are hand-built SVG**, not Mermaid — smaller, themeable, no client render cost.

## Honesty

Mock USDC is a 7-decimal testnet token, **not Circle USDC**, labeled "Mock USDC (testnet)" on first use everywhere. The trusted setup is a Phase-1 hackathon setup. Mainnet Circle USDC is on the roadmap.

## Deploy (Vercel)

Set project root to `web/`. `prebuild` syncs config and the events snapshot. Set `NEXT_PUBLIC_API_BASE` to a reachable PoolPass services URL for `/accredit` and `/faucet`; in-browser proving and verify work without it.
