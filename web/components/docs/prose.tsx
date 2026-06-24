import * as React from "react";
import { cn } from "@/lib/utils";

export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-lg", className)}>{children}</div>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-display-lg text-ink">{children}</h1>;
}
export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[68ch] text-body-lg text-ink-secondary">{children}</p>;
}
export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-xl scroll-mt-24 text-display-md font-light text-ink">
      {children}
    </h2>
  );
}
export function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="mt-lg scroll-mt-24 text-heading-md text-ink">
      {children}
    </h3>
  );
}
export function P({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[68ch] text-body-md leading-relaxed text-ink-secondary">{children}</p>;
}
export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="ml-lg flex max-w-[68ch] list-disc flex-col gap-xs text-body-md text-ink-secondary">{children}</ul>;
}
export function OL({ children }: { children: React.ReactNode }) {
  return <ol className="ml-lg flex max-w-[68ch] list-decimal flex-col gap-xs text-body-md text-ink-secondary">{children}</ol>;
}
export function Mono({ children }: { children: React.ReactNode }) {
  return <span className="mono rounded-xs bg-ink/5 px-xxs py-px text-[0.85em] text-ink">{children}</span>;
}

export function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-hairline bg-canvas-soft p-lg">
      {lang && <span className="mb-xs block text-micro-cap uppercase tracking-wide text-ink-mute">{lang}</span>}
      <code className="mono whitespace-pre text-[12.5px] leading-relaxed text-ink-secondary">{children}</code>
    </pre>
  );
}

export function Callout({
  children,
  tone = "info",
  title,
}: {
  children: React.ReactNode;
  tone?: "info" | "warn" | "proof";
  title?: string;
}) {
  const toneCls =
    tone === "warn"
      ? "border-ruby/30 bg-ruby/5"
      : tone === "proof"
        ? "border-accent-proof/30 bg-accent-proof/5"
        : "border-primary/25 bg-primary/[0.04]";
  return (
    <div className={cn("max-w-[68ch] rounded-lg border p-lg", toneCls)}>
      {title && <p className="mb-xs text-heading-sm text-ink">{title}</p>}
      <div className="text-body-md text-ink-secondary [&_p]:mb-sm last:[&_p]:mb-0">{children}</div>
    </div>
  );
}

/** Table for reference data (errors, constraints, byte layout). */
export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full min-w-[520px] text-left">
        <thead>
          <tr className="border-b border-hairline text-micro-cap uppercase tracking-wide text-ink-mute">
            {head.map((h) => (
              <th key={h} className="px-md py-sm font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-hairline/60 last:border-0">
              {r.map((c, j) => (
                <td key={j} className="px-md py-sm align-top text-body-md text-ink-secondary">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
