"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { truncate } from "@/lib/utils";

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success(label ? `${label} copied` : "Copied");
        setTimeout(() => setCopied(false), 1400);
      }}
      className="inline-flex items-center gap-xxs rounded-sm p-xxs text-ink-mute transition-colors hover:bg-ink/5 hover:text-ink"
      aria-label={`Copy ${label ?? "value"}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/** Monospace hash chip with copy. Truncates by default, full value on title. */
export function HashChip({
  value,
  full = false,
  className,
  copy = true,
}: {
  value: string;
  full?: boolean;
  className?: string;
  copy?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-xxs rounded-sm bg-ink/5 px-xs py-xxs mono text-[12px] text-ink-secondary",
        className,
      )}
      title={value}
    >
      <span className="break-all">{full ? value : truncate(value, 8, 6)}</span>
      {copy && <CopyButton value={value} />}
    </span>
  );
}
