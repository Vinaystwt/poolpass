import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-xs rounded-pill px-sm py-xxs text-micro-cap font-normal uppercase tracking-wide",
  {
    variants: {
      variant: {
        soft: "bg-ink/[0.06] text-ink-secondary",
        proof: "bg-accent-soft text-accent",
        neutral: "bg-ink/5 text-ink-mute",
        success: "bg-positive/15 text-positive",
        danger: "bg-danger/15 text-danger",
        outline: "border border-hairline-strong text-ink-mute",
      },
    },
    defaultVariants: { variant: "soft" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
