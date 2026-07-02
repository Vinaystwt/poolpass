import { Layers, Banknote, Blocks, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "PoolPass: Roadmap" };

const QUARTERS = [
  {
    q: "Q3 2026",
    theme: "Pool factory and depth scaling",
    icon: Layers,
    accent: "var(--ink-secondary)",
    bullets: [
      "Multi-issuer pool factory contract",
      "Dynamic Merkle depth up to 20",
      "Client-side per-investor proof package signing",
      "First-round security review on the circuit",
      "Published parameters for a Phase-2 trusted setup ceremony",
    ],
  },
  {
    q: "Q4 2026",
    theme: "Real assets and real USDC",
    icon: Banknote,
    accent: "var(--positive)",
    bullets: [
      "Mainnet deployment behind a feature flag",
      "Circle USDC integration via SAC, replacing Testnet USDC",
      "Partnership pilot with one regulated tokenized-treasury issuer on Stellar",
      "zkEmail integration for bank-statement-driven accreditation",
    ],
  },
  {
    q: "Q1 2027",
    theme: "Composability",
    icon: Blocks,
    accent: "var(--warning)",
    bullets: [
      "PoolPass tokens accepted as collateral in Blend",
      "Secondary-market hooks for whitelist transfers",
      "Nested proofs for delegated subscription, a wealth manager subscribes for N accredited clients with one proof",
    ],
  },
  {
    q: "Q2 2027",
    theme: "Recursive privacy and aggregation",
    icon: Repeat,
    accent: "var(--danger)",
    bullets: [
      "Recursive Groth16 batching to amortize verification across many subscriptions in one transaction",
      "Selective auditor disclosure, a regulator can request one nullifier's history without seeing others",
      "First external audit and bug bounty",
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-[820px] px-lg py-xxl">
      <Badge variant="proof">Roadmap</Badge>
      <h1 className="mt-lg text-display-lg text-ink">Where PoolPass goes next.</h1>
      <p className="mt-md max-w-[58ch] text-body-lg text-ink-secondary">
        From one demo pool to a multi-issuer, mainnet, Circle-USDC product with recursive proofs. Specific, and in
        order.
      </p>

      <div className="mt-huge">
        {QUARTERS.map((quarter, i) => (
          <div key={quarter.q} className="relative flex gap-lg pb-huge last:pb-0">
            {/* timeline rail */}
            <div className="flex flex-col items-center">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill"
                style={{ background: `color-mix(in srgb, ${quarter.accent} 14%, transparent)` }}
              >
                <quarter.icon className="h-5 w-5" style={{ color: quarter.accent }} />
              </span>
              {i < QUARTERS.length - 1 && <span className="mt-xs w-px flex-1" style={{ background: "var(--hairline)" }} />}
            </div>
            <div className="pt-xs">
              <div className="flex items-center gap-sm">
                <span className="text-micro-cap uppercase tracking-wide" style={{ color: quarter.accent }}>
                  {quarter.q}
                </span>
              </div>
              <h2 className="mt-xxs text-heading-lg text-ink">{quarter.theme}</h2>
              <ul className="mt-md flex flex-col gap-xs">
                {quarter.bullets.map((b) => (
                  <li key={b} className="flex gap-sm text-body-md text-ink-secondary">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: quarter.accent }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-primary/25 bg-primary/[0.04] p-lg">
        <p className="text-body-md text-ink-secondary">
          Roadmap items are commitments to direction, not delivery dates. We will update this page as we ship.
        </p>
      </div>
    </div>
  );
}
