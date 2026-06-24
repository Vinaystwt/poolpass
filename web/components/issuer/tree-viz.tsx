"use client";

import { truncate } from "@/lib/utils";

/** Compact depth-3 Merkle tree (8 leaves → 4 → 2 → 1). Hashes truncated, full on hover. */
export function TreeViz({ levels }: { levels: string[][] }) {
  if (!levels || levels.length < 4) return null;
  const width = 720;
  const rowY = [30, 110, 190, 270];
  const nodeFor = (count: number, i: number) => ((i + 0.5) * width) / count;

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline bg-canvas-soft p-lg">
      <svg viewBox={`0 0 ${width} 300`} className="w-full min-w-[640px]" role="img" aria-label="Merkle tree">
        {/* edges */}
        {[0, 1, 2].map((lvl) => {
          const child = levels[lvl];
          const parent = levels[lvl + 1];
          return child.map((_, i) => {
            const x1 = nodeFor(child.length, i);
            const y1 = rowY[3 - lvl];
            const x2 = nodeFor(parent.length, Math.floor(i / 2));
            const y2 = rowY[3 - lvl - 1];
            return (
              <line key={`${lvl}-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--hairline)" strokeWidth="1.2" />
            );
          });
        })}
        {/* nodes */}
        {levels.map((level, lvl) =>
          level.map((hash, i) => {
            const x = nodeFor(level.length, i);
            const y = rowY[3 - lvl];
            const isRoot = lvl === 3;
            const isZero = /^0+$/.test(hash);
            return (
              <g key={`n-${lvl}-${i}`}>
                <title>{hash}</title>
                <rect
                  x={x - 52}
                  y={y - 13}
                  width={104}
                  height={26}
                  rx={7}
                  fill={isRoot ? "var(--primary)" : "var(--card)"}
                  stroke={isRoot ? "var(--primary)" : isZero ? "var(--hairline)" : "var(--primary)"}
                  strokeOpacity={isRoot ? 1 : isZero ? 0.4 : 0.35}
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fill={isRoot ? "white" : isZero ? "var(--ink-mute)" : "var(--ink)"}
                >
                  {isZero ? "∅ zero" : truncate(hash, 5, 4)}
                </text>
              </g>
            );
          }),
        )}
        <text x={8} y={rowY[0] + 4} fontSize="9" fill="var(--ink-mute)">root</text>
        <text x={8} y={rowY[3] + 4} fontSize="9" fill="var(--ink-mute)">leaves</text>
      </svg>
    </div>
  );
}
