"use client";

import * as React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { defineTerm } from "@/lib/glossary";
import { cn } from "@/lib/utils";

/**
 * Wraps a ZK term with a dotted underline and a plain-language definition on
 * hover/tap. No ZK term should appear naked in the core flow; use <Term> on first
 * use. Definitions come from lib/glossary.ts. `define` overrides the lookup key
 * when the visible text differs from the glossary key.
 */
export function Term({
  children,
  define,
  className,
}: {
  children: React.ReactNode;
  define?: string;
  className?: string;
}) {
  const key = define ?? (typeof children === "string" ? children : "");
  const definition = defineTerm(key);
  if (!definition) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "cursor-help rounded-xs underline decoration-dotted decoration-ink-mute/60 underline-offset-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            className,
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[280px]">{definition}</TooltipContent>
    </Tooltip>
  );
}
