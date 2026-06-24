"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GitCommitVertical, Cpu, Unlock, Sigma } from "lucide-react";
import { Term } from "@/components/shared/term";

const STEPS = [
  {
    icon: GitCommitVertical,
    title: "Issuer commits",
    plain: "The issuer confirms who qualifies and publishes a single fingerprint of that list on Stellar. Your details are not in it.",
    math: "Each member becomes a leaf = Poseidon3(investor_id, cap, secret). The leaves fold into one Merkle root, committed by update_accredited_set.",
  },
  {
    icon: Cpu,
    title: "You prove",
    plain: "In your browser, you prove you are on the list and that your amount fits your limit. Nothing private leaves the page.",
    math: "A Groth16 proof shows a Merkle path to the root and amount ≤ cap. Only a 256-byte proof and four public inputs leave the device.",
  },
  {
    icon: Unlock,
    title: "The pool unlocks",
    plain: "Stellar checks the proof and settles your subscription. The ledger never learns who you are.",
    math: "The contract verifies the proof with the native BN254 host function, records a nullifier and a commitment, and settles the transfer.",
  },
];

export function StepFlow() {
  const reduce = useReducedMotion();
  return (
    <div className="grid gap-lg md:grid-cols-3">
      {STEPS.map((s, i) => (
        <motion.div
          key={s.title}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.26, delay: i * 0.08, ease: "easeOut" }}
          className="relative flex flex-col rounded-lg border border-hairline bg-card p-xl shadow-e1"
        >
          <span className="absolute right-lg top-lg tnum text-display-md font-light text-hairline">
            0{i + 1}
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <s.icon className="h-5 w-5 text-primary" />
          </span>
          <h3 className="mt-md text-heading-md text-ink">{s.title}</h3>
          <p className="mt-sm flex-1 text-body-md text-ink-secondary">{s.plain}</p>
          <details className="group mt-md border-t border-hairline pt-sm">
            <summary className="flex cursor-pointer list-none items-center gap-xs text-caption text-ink-mute transition-colors hover:text-ink">
              <Sigma className="h-3.5 w-3.5" /> the math
            </summary>
            <p className="mt-xs mono text-[12px] leading-relaxed text-ink-secondary">{s.math}</p>
          </details>
        </motion.div>
      ))}
    </div>
  );
}

// Re-exported so the landing can reference a glossary term inline without importing twice.
export { Term };
