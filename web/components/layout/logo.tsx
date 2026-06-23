import { cn } from "@/lib/utils";

/** PoolPass mark: three Merkle leaves resolving into a single proof node. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-sm", className)}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <rect width="26" height="26" rx="7" fill="var(--primary)" />
        <circle cx="13" cy="7" r="2.4" fill="white" />
        <circle cx="7.5" cy="18" r="2.4" fill="white" opacity="0.85" />
        <circle cx="18.5" cy="18" r="2.4" fill="white" opacity="0.55" />
        <path d="M13 9.2 L8.2 15.8 M13 9.2 L17.8 15.8" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      </svg>
      <span className="text-heading-sm font-medium tracking-tight text-ink">PoolPass</span>
    </span>
  );
}
