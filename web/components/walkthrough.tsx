"use client";

import * as React from "react";
import { create } from "zustand";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourState {
  open: boolean;
  step: number;
  start: () => void;
  close: () => void;
  next: () => void;
  back: () => void;
}

const DISMISS_KEY = "poolpass-tour-dismissed";

export const useTour = create<TourState>((set) => ({
  open: false,
  step: 0,
  start: () => set({ open: true, step: 0 }),
  close: () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    set({ open: false });
  },
  next: () => set((s) => ({ step: Math.min(s.step + 1, STEPS.length - 1) })),
  back: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
}));

const STEPS: { title: string; body: string; anchor?: string; cta?: string; href?: string }[] = [
  {
    title: "What PoolPass is",
    body: "Prove you belong on the guest list without showing your ID. You join a gated investment pool without revealing who you are or what you own.",
  },
  {
    title: "Four steps, that is all",
    body: "Choose a pool. Get accredited. Prove privately, in your browser. Subscribe. Steps 1 and 2 need no wallet.",
    anchor: "four-verbs",
    cta: "Show me the steps",
  },
  {
    title: "Pick a pool",
    body: "Three real pools on testnet, each with its own gate and cap. Open one to inspect its gate and its live subscribers before you commit.",
    cta: "Open the marketplace",
    href: "/invest",
  },
  {
    title: "Prove, then verify",
    body: "The proof runs on your machine in about a second. Anyone can re-run the math to confirm your subscription. Nothing private ever leaves your device.",
    cta: "Try a proof now",
    href: "/prove",
  },
];

/** A calm, dismissible guided tour. Teaches on the live page. Remembers dismissal per session. */
export function Walkthrough() {
  const { open, step, close, next, back } = useTour();

  React.useEffect(() => {
    if (!open) return;
    const anchor = STEPS[step].anchor;
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [open, step]);

  if (!open) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-x-0 bottom-lg z-50 flex justify-center px-lg" role="dialog" aria-label="Walkthrough">
      <div className="w-full max-w-[440px] rounded-xl border border-hairline bg-card p-lg shadow-e2">
        <div className="flex items-start justify-between gap-md">
          <div>
            <p className="text-micro-cap uppercase tracking-wide text-ink-mute">
              Step {step + 1} of {STEPS.length}
            </p>
            <p className="mt-xxs text-heading-sm text-ink">{s.title}</p>
          </div>
          <button onClick={close} aria-label="Dismiss walkthrough" className="rounded-sm p-xs text-ink-mute hover:bg-ink/5 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-sm text-body-md text-ink-secondary">{s.body}</p>
        <div className="mt-md flex items-center justify-between gap-sm">
          <button
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-xxs text-caption text-ink-mute disabled:opacity-40 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div className="flex items-center gap-sm">
            {s.href ? (
              <Button asChild size="sm">
                <a href={s.href} onClick={close}>
                  {s.cta} <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            ) : last ? (
              <Button size="sm" onClick={close}>
                Got it
              </Button>
            ) : (
              <Button size="sm" onClick={next}>
                {s.cta ?? "Next"} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Secondary CTA button that starts the tour. */
export function WalkthroughButton({ className }: { className?: string }) {
  const start = useTour((s) => s.start);
  return (
    <button
      type="button"
      onClick={start}
      className={className ?? "text-caption text-ink-mute underline decoration-dotted underline-offset-4 hover:text-ink"}
    >
      New here? 60-second walkthrough
    </button>
  );
}
