"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Pill buttons, tight 8px/16px padding — DESIGN.md transactional feel.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-sm whitespace-nowrap rounded-pill text-[16px] font-normal leading-none transition-[background,color,box-shadow,transform] duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] active:duration-[80ms]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-deep active:bg-primary-press",
        secondary: "bg-canvas text-primary border border-primary hover:bg-primary/5",
        onDark: "bg-brand-dark text-on-primary hover:opacity-90",
        proof:
          "bg-accent-proof text-white hover:opacity-90 shadow-[0_4px_16px_rgba(124,92,255,0.25)]",
        ghost: "bg-transparent text-ink hover:bg-ink/5",
        outline: "bg-canvas text-ink border border-hairline-input hover:border-primary hover:text-primary",
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
