import Link from "next/link";
import { ArrowRight, FileLock2, Clock4, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/reveal";
import { Term } from "@/components/shared/term";
import { MiniDemoLazy } from "@/components/landing/mini-demo-lazy";
import { LiveStats } from "@/components/landing/live-stats";
import { TrustStrip } from "@/components/landing/trust-strip";
import { StepFlow } from "@/components/landing/step-flow";

const PROBLEMS = [
  {
    icon: FileLock2,
    title: "Bank statements end up in CRMs",
    body: "Today, proving you qualify means handing an issuer your identity and your net worth. That data sits in a database forever.",
    source: "SEC accredited-investor rule, 17 CFR 230.501",
    href: "https://www.sec.gov/education/capitalraising/building-blocks/accredited-investor",
  },
  {
    icon: Clock4,
    title: "Three weeks of accreditation, per issuer",
    body: "Every pool re-runs the same verification. The investor repeats the same disclosure for each new opportunity.",
    source: "Industry accreditation workflows",
    href: "https://www.sec.gov/education/capitalraising/building-blocks/accredited-investor",
  },
  {
    icon: Globe2,
    title: "$2B+ tokenized RWA, retail mostly excluded",
    body: "Real-world assets are live on Stellar. The gate between a regulated issuer and a private subscriber is unsolved everywhere else.",
    source: "Stellar tokenized-asset ecosystem",
    href: "https://stellar.org/products-and-services/real-world-assets",
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* ── Hero: H1 left, live proof demo right, above the fold ── */}
      <section className="relative overflow-hidden">
        <div className="mesh-bg pointer-events-none absolute inset-x-0 top-0 h-[460px] opacity-60" />
        <div className="relative mx-auto max-w-container px-lg pb-xxl pt-xxl">
          <div className="grid items-center gap-xl lg:grid-cols-[1fr_0.92fr]">
            <div>
              <Badge variant="soft">Real-world ZK on Stellar</Badge>
              <h1 className="mt-lg text-display-xxl text-balance text-ink">
                Prove you qualify. Reveal nothing.
              </h1>
              <p className="mt-lg max-w-[52ch] text-body-lg text-ink-secondary">
                Subscribe to gated real-world-asset pools on Stellar without exposing your identity, your wealth, or
                the issuer&rsquo;s investor list. The proof runs in your browser in seconds.
              </p>
              <div className="mt-xl flex flex-wrap items-center gap-md">
                <Button asChild size="lg">
                  <Link href="/invest">
                    Try the demo pool <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/issuer">For issuers</Link>
                </Button>
              </div>
              <p className="mt-md text-caption text-ink-mute">
                New to this?{" "}
                <Link href="/how" className="text-primary underline-offset-2 hover:underline">
                  Start here
                </Link>
                . Testnet only, uses Mock USDC (testnet), a 7-decimal token, not Circle USDC. No real money moves.
              </p>
            </div>

            <Reveal delay={0.08}>
              <MiniDemoLazy />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── The problem, immediately after the hero ── */}
      <section className="border-y border-hairline bg-canvas-soft">
        <div className="mx-auto max-w-container px-lg py-huge">
          <Reveal>
            <h2 className="text-display-lg text-ink">Accreditation costs you your privacy.</h2>
            <p className="mt-md max-w-[52ch] text-body-lg text-ink-secondary">
              The proof in the hero solves a real problem. Here is the problem.
            </p>
          </Reveal>
          <div className="mt-xl grid gap-lg md:grid-cols-3">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.05}>
                <div className="flex h-full flex-col rounded-lg border border-hairline bg-card p-xl shadow-e1">
                  <p.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-md text-heading-md text-ink">{p.title}</h3>
                  <p className="mt-sm flex-1 text-body-md text-ink-secondary">{p.body}</p>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-md text-micro text-ink-mute underline decoration-dotted underline-offset-2 hover:text-primary"
                  >
                    {p.source}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works, plain first with "the math" behind a toggle ── */}
      <section id="the-loop" className="mx-auto max-w-container px-lg py-huge">
        <Reveal>
          <h2 className="text-display-lg text-ink">Issuer commits. You prove. The pool unlocks.</h2>
          <p className="mt-md max-w-[52ch] text-body-lg text-ink-secondary">
            Three steps in plain language. Open &ldquo;the math&rdquo; on any step to see the exact cryptography.
          </p>
        </Reveal>
        <div className="mt-xl">
          <StepFlow />
        </div>
      </section>

      {/* ── The proof moment, explained ── */}
      <section className="border-y border-hairline bg-canvas-soft">
        <div className="mx-auto max-w-container px-lg py-huge">
          <Reveal>
            <div className="grid gap-xl lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <Badge variant="proof">What just happened</Badge>
                <h2 className="mt-md text-display-lg text-ink">You proved you belong, and showed nothing else.</h2>
                <p className="mt-md max-w-[48ch] text-body-lg text-ink-secondary">
                  The demo in the hero ran a real{" "}
                  <Term define="proof">proof</Term> on your machine. It convinced anyone checking that your entry is on
                  the issuer&rsquo;s list and your amount fits your limit. It revealed only four{" "}
                  <Term define="public inputs">public inputs</Term>, never your identity.
                </p>
              </div>
              <div className="rounded-xl border border-hairline bg-card p-xl shadow-e1">
                <ul className="flex flex-col gap-md">
                  {[
                    ["Stays private", "Who you are, your wealth, which list entry is yours."],
                    ["Goes public", "A 256-byte proof and four values: list root, amount, a one-time tag, the round."],
                    ["Anyone can check", "The same math runs in any browser, against the published verifying key."],
                  ].map(([k, v]) => (
                    <li key={k} className="flex gap-md">
                      <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full bg-accent-proof" />
                      <span className="text-body-md text-ink-secondary">
                        <strong className="text-ink">{k}.</strong> {v}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Live stats ── */}
      <LiveStats />

      {/* ── Trust strip ── */}
      <section className="mx-auto max-w-container px-lg py-huge">
        <Reveal>
          <p className="text-micro-cap uppercase tracking-wide text-ink-mute">Built on, credited to</p>
          <TrustStrip />
        </Reveal>
      </section>

      {/* ── Final CTA, folds in the old /demo "see the loop" intent ── */}
      <section className="relative overflow-hidden border-t border-hairline">
        <div className="mesh-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-container px-lg py-huge text-center">
          <Reveal>
            <h2 className="mx-auto max-w-[20ch] text-display-xl text-ink">Run the whole loop from one device.</h2>
            <p className="mx-auto mt-md max-w-[46ch] text-body-lg text-ink-secondary">
              Accredit yourself, prove in the browser, subscribe on testnet, and verify it independently. No real money
              is involved.
            </p>
            <div className="mt-xl flex flex-wrap justify-center gap-md">
              <Button asChild size="lg">
                <Link href="/invest">
                  Launch the app <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/how">See the loop</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
