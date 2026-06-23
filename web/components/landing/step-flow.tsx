"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GitCommitVertical, Cpu, Unlock } from "lucide-react";

const STEPS = [
  {
    icon: GitCommitVertical,
    title: "Issuer commits",
    body: "The issuer builds a Merkle tree of accredited leaves and commits the root on-chain. Each leaf is Poseidon3(investor_id, cap, secret).",
  },
  {
    icon: Cpu,
    title: "Investor proves",
    body: "You prove membership in the tree and that your amount fits your cap — in the browser. Only a 256-byte proof and four public inputs leave your device.",
  },
  {
    icon: Unlock,
    title: "Pool unlocks",
    body: "The contract verifies the proof natively on Stellar, records a nullifier and a commitment, and settles your Mock USDC. No identity touches the ledger.",
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
          className="relative rounded-lg border border-hairline bg-card p-xl shadow-e1"
        >
          <span className="absolute right-lg top-lg tnum text-display-md font-light text-hairline">
            0{i + 1}
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <s.icon className="h-5 w-5 text-primary" />
          </span>
          <h3 className="mt-md text-heading-md text-ink">{s.title}</h3>
          <p className="mt-sm text-body-md text-ink-secondary">{s.body}</p>
        </motion.div>
      ))}
    </div>
  );
}
