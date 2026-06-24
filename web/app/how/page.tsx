import Link from "next/link";
import { ArrowRight, Cpu, ShieldCheck, Wallet, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Term } from "@/components/shared/term";
import { StepFlow } from "@/components/landing/step-flow";
import { WorkflowDiagram } from "@/components/diagrams/workflow-diagram";

export const metadata = { title: "PoolPass: how it works" };

export default function HowPage() {
  return (
    <div className="mx-auto max-w-[820px] px-lg py-xxl">
      <Badge variant="soft">Start here</Badge>
      <h1 className="mt-md text-display-lg text-ink">What PoolPass is, in plain words.</h1>
      <p className="mt-md text-body-lg text-ink-secondary">
        Some investment pools are open only to people who qualify (for example, accredited investors). Normally you
        prove you qualify by handing over your identity and financial details. PoolPass lets you prove you qualify
        without revealing any of that. You stay private, the issuer keeps its records, and the public ledger only sees
        that a valid member subscribed.
      </p>

      <section className="mt-huge">
        <h2 className="text-display-md text-ink">The loop</h2>
        <p className="mt-xs text-body-md text-ink-mute">
          Three steps. Plain language first, with the exact cryptography one click away.
        </p>
        <div className="mt-lg">
          <WorkflowDiagram />
        </div>
        <div className="mt-lg">
          <StepFlow />
        </div>
      </section>

      <section className="mt-huge">
        <h2 className="text-display-md text-ink">What you do, step by step</h2>
        <div className="mt-lg flex flex-col gap-md">
          {[
            {
              icon: ShieldCheck,
              title: "1 · Accredit (no wallet needed)",
              body: (
                <>
                  Get added to the issuer&rsquo;s list. We generate your details on your device and send only a hashed{" "}
                  <Term define="leaf">leaf</Term> to the issuer. Your secret never leaves your machine.
                </>
              ),
            },
            {
              icon: Cpu,
              title: "2 · Prove (no wallet needed)",
              body: (
                <>
                  Your browser builds a <Term define="proof">proof</Term> that you are on the list and your amount fits
                  your limit. It takes about a second. Nothing private leaves the page.
                </>
              ),
            },
            {
              icon: Wallet,
              title: "3 · Subscribe (wallet required)",
              body: (
                <>
                  Connect a Freighter wallet with testnet funds and submit. Stellar checks the proof and settles your
                  Mock USDC (testnet). This is the only step that needs a wallet.
                </>
              ),
            },
            {
              icon: ListChecks,
              title: "4 · Verify (anyone, no wallet)",
              body: <>Anyone can independently re-run the math on your subscription and confirm it is valid.</>,
            },
          ].map((s) => (
            <div key={s.title} className="flex gap-md rounded-lg border border-hairline bg-card p-lg shadow-e1">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-4 w-4 text-primary" />
              </span>
              <div>
                <h3 className="text-heading-sm text-ink">{s.title}</h3>
                <p className="mt-xxs text-body-md text-ink-secondary">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-huge rounded-xl border border-hairline bg-canvas-soft p-xl text-center">
        <h2 className="text-display-md text-ink">Ready?</h2>
        <p className="mx-auto mt-xs max-w-[46ch] text-body-md text-ink-secondary">
          Run a proof first with no wallet, or jump straight into the demo pool. Everything is on testnet with Mock USDC
          (testnet). No real money moves.
        </p>
        <div className="mt-md flex flex-wrap justify-center gap-md">
          <Button asChild size="lg">
            <Link href="/invest">
              Try the demo pool <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/prove">Run a proof first</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
