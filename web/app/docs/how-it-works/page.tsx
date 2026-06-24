import { Prose, H1, Lead, H2, OL, Mono, Callout } from "@/components/docs/prose";

export const metadata = { title: "PoolPass docs: How it works" };

export default function HowItWorks() {
  return (
    <Prose>
      <H1>How it works</H1>
      <Lead>
        Four actors, one loop: the issuer commits an accredited set, the investor proves membership in the browser, the
        contract verifies the proof natively, and the pool settles.
      </Lead>

      <LoopDiagram />

      <H2 id="loop">The loop, step by step</H2>
      <OL>
        <li>
          <strong>Accredit.</strong> The issuer (or the self-serve route) builds a Merkle tree whose leaves are{" "}
          <Mono>Poseidon3(investor_id, cap, investor_secret)</Mono>, and commits the root on chain with{" "}
          <Mono>update_accredited_set</Mono>. That emits <Mono>RootUpdated</Mono> with the new root and epoch.
        </li>
        <li>
          <strong>Prove.</strong> The investor assembles the circuit input, their private identity plus the Merkle path,
          and runs snarkjs in a Web Worker. Out comes a 256-byte proof and four public inputs:{" "}
          <Mono>[merkle_root, amount, nullifier, epoch]</Mono>. The private inputs never leave the browser.
        </li>
        <li>
          <strong>Verify.</strong> The investor calls <Mono>subscribe</Mono>. The contract checks the proof against the
          committed verifying key using the native BN254 host function, checks the root and epoch match current pool
          state, and rejects a reused nullifier.
        </li>
        <li>
          <strong>Settle.</strong> The contract pulls the public <Mono>amount</Mono> of {`Mock USDC`} from the investor,
          mints pool tokens, records the nullifier, and emits <Mono>Subscribed</Mono> with the commitment.
        </li>
      </OL>

      <Callout title="What the ledger sees">
        <p>
          A passive observer sees the subscribing wallet, the amount, a nullifier, and a commitment. They do not see
          which leaf was used, the investor&rsquo;s id, their cap, or their secret, and so cannot link the subscription
          to a real-world identity or to the same investor across epochs.
        </p>
      </Callout>
    </Prose>
  );
}

function LoopDiagram() {
  const nodes = [
    { x: 40, label: "Issuer", sub: "commits root" },
    { x: 230, label: "Investor", sub: "proves in browser" },
    { x: 420, label: "Contract", sub: "verifies natively" },
    { x: 610, label: "Pool", sub: "settles + mints" },
  ];
  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-hairline bg-canvas-soft p-lg">
      <svg viewBox="0 0 760 140" className="w-full min-w-[680px]" role="img" aria-label="PoolPass loop diagram">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--primary)" />
          </marker>
        </defs>
        {nodes.map((n, i) => (
          <g key={n.label}>
            <rect x={n.x} y={40} width={120} height={56} rx={12} fill="var(--card)" stroke="var(--primary)" strokeOpacity="0.35" />
            <text x={n.x + 60} y={66} textAnchor="middle" fontSize="14" fill="var(--ink)">
              {n.label}
            </text>
            <text x={n.x + 60} y={84} textAnchor="middle" fontSize="10.5" fill="var(--ink-mute)">
              {n.sub}
            </text>
            {i < nodes.length - 1 && (
              <line x1={n.x + 120} y1={68} x2={n.x + 190} y2={68} stroke="var(--primary)" strokeWidth="1.5" markerEnd="url(#arrow)" />
            )}
          </g>
        ))}
        <text x={380} y={24} textAnchor="middle" fontSize="11" fill="var(--accent-proof)">
          private inputs stay in the browser · only a 256-byte proof crosses the wire
        </text>
      </svg>
    </div>
  );
}
