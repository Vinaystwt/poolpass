import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-xs rounded-pill px-sm py-xxs text-micro-cap font-normal uppercase tracking-wide",
  {
    variants: {
      variant: {
        soft: "bg-primary-subdued text-primary-deep",
        proof: "bg-accent-proof/15 text-accent-proof",
        neutral: "bg-ink/5 text-ink-mute",
        success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        danger: "bg-ruby/15 text-ruby",
        outline: "border border-hairline-input text-ink-mute",
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
