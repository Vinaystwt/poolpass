"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GitCommitVertical, Cpu, ShieldCheck, Unlock, type LucideIcon } from "lucide-react";

/**
 * The end-to-end workflow, animated. Left of the divider is the investor's device,
 * where private inputs stay. Only a 256-byte proof crosses the divider to Stellar.
 * Scroll into view (or reduced-motion static) draws the path step by step.
 */
export function WorkflowDiagram() {
  const reduce = useReducedMotion();
  const draw = (delay: number) =>
    reduce
      ? { initial: { pathLength: 1, opacity: 1 } }
      : {
          initial: { pathLength: 0, opacity: 0 },
          whileInView: { pathLength: 1, opacity: 1 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.6, delay, ease: "easeInOut" as const },
        };
  const pop = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.3, delay },
        };

  return (
    <div className="overflow-x-auto rounded-xl border border-hairline bg-canvas-soft p-lg">
      <svg viewBox="0 0 920 300" className="w-full min-w-[760px]" role="img" aria-label="PoolPass end-to-end workflow">
        {/* zone labels */}
        <text x="24" y="28" fontSize="11" letterSpacing="0.06em" fill="var(--ink-mute)">ON YOUR DEVICE</text>
        <text x="664" y="28" fontSize="11" letterSpacing="0.06em" fill="var(--ink-mute)">ON STELLAR</text>

        {/* divider */}
        <line x1="620" y1="44" x2="620" y2="276" stroke="var(--hairline-strong)" strokeDasharray="4 5" strokeWidth="1.5" />

        {/* connecting paths */}
        <motion.path d="M150 120 H300" fill="none" stroke="var(--hairline-strong)" strokeWidth="2" {...draw(0.1)} />
        {/* proof crossing the divider, in accent */}
        <motion.path d="M450 120 H770" fill="none" stroke="var(--accent)" strokeWidth="2.5" markerEnd="url(#wf-arrow)" {...draw(0.5)} />
        <motion.path d="M770 156 V196" fill="none" stroke="var(--hairline-strong)" strokeWidth="2" markerEnd="url(#wf-arrow-mute)" {...draw(1.0)} />

        <defs>
          <marker id="wf-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
          </marker>
          <marker id="wf-arrow-mute" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--hairline-strong)" />
          </marker>
        </defs>

        {/* nodes */}
        <Node x={30} y={92} title="Accredit" sub="leaf to issuer" Icon={GitCommitVertical} pop={pop(0)} />
        <Node x={300} y={92} title="Prove" sub="in your browser" Icon={Cpu} pop={pop(0.2)} accent />
        <Node x={650} y={92} title="Verify" sub="native on chain" Icon={ShieldCheck} pop={pop(0.7)} accent />
        <Node x={650} y={196} title="Settle" sub="pool unlocks" Icon={Unlock} pop={pop(1.1)} />

        {/* proof label */}
        <motion.g {...pop(0.6)}>
          <rect x="486" y="86" width="128" height="22" rx="11" fill="var(--accent-soft)" />
          <text x="550" y="101" textAnchor="middle" fontSize="11" fill="var(--accent)">
            proof · 256 bytes
          </text>
        </motion.g>

        {/* private-stays pin */}
        <motion.g {...pop(0.35)}>
          <g transform="translate(300 210)">
            <rect x="0" y="0" width="190" height="56" rx="10" fill="var(--card)" stroke="var(--hairline)" />
            <g transform="translate(14 18)" stroke="var(--ink-mute)" strokeWidth="1.6" fill="none">
              <rect x="0" y="7" width="14" height="10" rx="2" />
              <path d="M3 7 V4 a4 4 0 0 1 8 0 V7" />
            </g>
            <text x="40" y="24" fontSize="11.5" fill="var(--ink)">investor_id, cap, secret</text>
            <text x="40" y="40" fontSize="10.5" fill="var(--ink-mute)">never leave this device</text>
          </g>
        </motion.g>
      </svg>
    </div>
  );
}

function Node({
  x,
  y,
  title,
  sub,
  Icon,
  pop,
  accent,
}: {
  x: number;
  y: number;
  title: string;
  sub: string;
  Icon: LucideIcon;
  pop: object;
  accent?: boolean;
}) {
  const stroke = accent ? "var(--accent)" : "var(--hairline-strong)";
  return (
    <motion.g {...pop}>
      <rect x={x} y={y} width={120} height={56} rx={12} fill="var(--card)" stroke={stroke} strokeOpacity={accent ? 0.5 : 1} />
      <g transform={`translate(${x + 14} ${y + 18})`} color={accent ? "var(--accent)" : "var(--ink-secondary)"}>
        <Icon width={20} height={20} />
      </g>
      <text x={x + 44} y={y + 26} fontSize="14" fill="var(--ink)">{title}</text>
      <text x={x + 44} y={y + 42} fontSize="10.5" fill="var(--ink-mute)">{sub}</text>
    </motion.g>
  );
}
