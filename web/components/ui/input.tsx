import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex min-h-[40px] w-full rounded-sm border border-hairline-input bg-card px-md py-sm text-body-md text-ink placeholder:text-ink-mute transition-colors focus:border-primary focus:outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex w-full rounded-sm border border-hairline-input bg-card px-md py-sm text-body-md text-ink placeholder:text-ink-mute transition-colors focus:border-primary focus:outline-none disabled:opacity-50 mono text-[13px]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
