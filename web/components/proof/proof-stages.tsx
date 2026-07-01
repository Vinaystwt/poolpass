"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProofStage } from "@/lib/zk/types";

const ORDER: { key: ProofStage; label: string; detail: string }[] = [
  { key: "witness", label: "On the list", detail: "Confirming you are on the issuer's approved list" },
  { key: "prove", label: "Within cap", detail: "Proving your amount is within your limit" },
  { key: "verify", label: "Checked", detail: "Checking the proof, locally, before it goes anywhere" },
];

function rank(stage: ProofStage): number {
  switch (stage) {
    case "witness":
      return 0;
    case "prove":
      return 1;
    case "verify":
      return 2;
    case "done":
      return 3;
    default:
      return -1;
  }
}

export function ProofStages({ stage }: { stage: ProofStage }) {
  const current = rank(stage);
  return (
    <ol className="flex flex-col gap-sm">
      {ORDER.map((s, i) => {
        const done = current > i || stage === "done";
        const active = current === i && stage !== "done";
        return (
          <li
            key={s.key}
            className={cn(
              "flex items-start gap-md rounded-md border px-md py-sm transition-colors",
              active && "border-accent-proof/40 bg-accent-proof/5",
              done && "border-emerald-500/30 bg-emerald-500/5",
              !active && !done && "border-hairline",
            )}
          >
            <span
              className={cn(
                "mt-xxs flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                done && "bg-emerald-500 text-white",
                active && "bg-accent-proof text-white",
                !active && !done && "bg-ink/10 text-ink-mute",
              )}
            >
              {done ? <Check className="h-3 w-3" /> : active ? <Loader2 className="h-3 w-3 animate-spin" /> : i + 1}
            </span>
            <div className="min-w-0">
              <p className={cn("text-body-md", active ? "text-accent-proof" : done ? "text-ink" : "text-ink-mute")}>
                {s.label}
              </p>
              <p className="text-caption text-ink-mute">{s.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
