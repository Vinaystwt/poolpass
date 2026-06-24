// Static system map for the docs. Themeable via tokens, no animation.
export function ArchitectureDiagram() {
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline bg-canvas-soft p-lg">
      <svg viewBox="0 0 920 360" className="w-full min-w-[760px]" role="img" aria-label="PoolPass architecture">
        <defs>
          <marker id="ar-a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--hairline-strong)" />
          </marker>
        </defs>

        {/* column labels */}
        <text x="20" y="26" fontSize="11" letterSpacing="0.06em" fill="var(--ink-mute)">BROWSER</text>
        <text x="350" y="26" fontSize="11" letterSpacing="0.06em" fill="var(--ink-mute)">SERVICES (NODE)</text>
        <text x="700" y="26" fontSize="11" letterSpacing="0.06em" fill="var(--ink-mute)">STELLAR TESTNET</text>

        {/* browser */}
        <Box x={20} y={120} w={220} h={120} title="This frontend" lines={["snarkjs Web Worker (prove)", "verify (client-side)", "wallet (Freighter)"]} accent />

        {/* services */}
        <Box x={330} y={48} w={250} h={70} title="api" lines={["/accredit /faucet /verify", "/prove (fallback) /pool/demo"]} />
        <Box x={330} y={150} w={250} h={60} title="indexer" lines={["RPC getEvents to events.json"]} />
        <Box x={330} y={244} w={250} h={60} title="demo-issuer" lines={["holds issuer key, mints"]} />

        {/* contracts */}
        <Box x={680} y={48} w={220} h={70} title="PoolPass" lines={["subscribe, update_set", "advance_epoch"]} accent />
        <Box x={680} y={140} w={220} h={56} title="Mock USDC (SAC)" lines={["7-decimal test token"]} />
        <Box x={680} y={212} w={220} h={56} title="Pool token" lines={["minted on subscribe"]} />
        <Box x={680} y={284} w={220} h={56} title="Gate contracts" lines={["Poseidon + Groth16 parity"]} />

        {/* flows */}
        <Flow d="M240 140 H330" />
        <Flow d="M580 83 H680" />
        <Flow d="M240 190 C 430 220, 520 96, 680 90" />
        <Flow d="M790 118 V140" />
        <Flow d="M790 118 V212" />
        <Flow d="M680 96 C 500 130, 440 200, 580 190" />

        {/* flow legend */}
        <text x="250" y="132" fontSize="10" fill="var(--ink-mute)">leaf</text>
        <text x="600" y="76" fontSize="10" fill="var(--ink-mute)">invoke</text>
        <text x="430" y="250" fontSize="10" fill="var(--ink-mute)">proof + subscribe</text>
        <text x="500" y="208" fontSize="10" fill="var(--ink-mute)">events</text>
      </svg>
    </div>
  );
}

function Box({
  x,
  y,
  w,
  h,
  title,
  lines,
  accent,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines: string[];
  accent?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={12}
        fill="var(--card)"
        stroke={accent ? "var(--accent)" : "var(--hairline-strong)"}
        strokeOpacity={accent ? 0.5 : 1}
      />
      <text x={x + 16} y={y + 26} fontSize="14" fill="var(--ink)">{title}</text>
      {lines.map((l, i) => (
        <text key={i} x={x + 16} y={y + 46 + i * 16} fontSize="11" fill="var(--ink-mute)" fontFamily="var(--font-mono)">
          {l}
        </text>
      ))}
    </g>
  );
}

function Flow({ d }: { d: string }) {
  return <path d={d} fill="none" stroke="var(--hairline-strong)" strokeWidth="1.5" markerEnd="url(#ar-a)" />;
}
