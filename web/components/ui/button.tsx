"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Pill buttons, tight 8px/16px padding — DESIGN.md transactional feel.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-sm whitespace-nowrap rounded-pill text-[15px] font-medium leading-none transition-[background,color,box-shadow,transform] duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] active:duration-[80ms]",
  {
    variants: {
      variant: {
        // accent (violet) is the single primary CTA per page
        primary: "bg-accent text-on-accent hover:bg-accent-deep active:bg-accent-press",
        // generic interactive: ink + hairline, never violet
        secondary: "bg-card text-ink border border-hairline-strong hover:border-ink hover:bg-ink/[0.03]",
        onDark: "bg-ink text-canvas hover:opacity-90",
        proof: "bg-accent text-on-accent hover:bg-accent-deep shadow-proof-glow",
        ghost: "bg-transparent text-ink-secondary hover:bg-ink/5 hover:text-ink",
        outline: "bg-card text-ink border border-hairline-strong hover:border-ink",
      },
      size: {
        md: "px-lg py-sm min-h-[40px]",
        sm: "px-md py-xs text-[14px] min-h-[34px]",
        lg: "px-xl py-md min-h-[48px] text-[16px]",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
