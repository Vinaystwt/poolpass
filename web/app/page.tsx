import Link from "next/link";
import { ArrowRight, FileLock2, Clock4, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/reveal";
import { MiniDemo } from "@/components/landing/mini-demo";
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
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mesh-bg pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70" />
        <div className="relative mx-auto max-w-container px-lg pb-huge pt-huge">
          <Reveal>
            <Badge variant="soft">Real-world ZK on Stellar</Badge>
          </Reveal>
          <Reveal delay={0.04}>
            <h1 className="mt-lg max-w-[14ch] text-display-xxl text-balance text-ink">
              Prove you qualify. Reveal nothing.
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-lg max-w-[58ch] text-body-lg text-ink-secondary">
              Subscribe to gated real-world-asset pools on Stellar without exposing your identity, your wealth, or
              the issuer&rsquo;s investor list. The proof runs in your browser in seconds.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
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
              Testnet only · uses Mock USDC (testnet), a 7-decimal token, not Circle USDC. No real money moves.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── The proof moment (the single most important section) ── */}
      <section className="mx-auto max-w-container px-lg pb-huge">
        <Reveal>
          <div className="grid gap-xl lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <h2 className="text-display-lg text-ink">Feel the proof, not the pitch.</h2>
              <p className="mt-md max-w-[46ch] text-body-lg text-ink-secondary">
                Most zero-knowledge demos ask you to trust a screenshot. This one runs a real Groth16 proof on your
                machine — about 1,350 constraints, a 256-byte proof — and verifies it locally. Watch the witness,
                prove, and verify stages happen for real.
              </p>
              <dl className="mt-xl grid grid-cols-3 gap-md">
                {[
                  ["256", "byte proof"],
                  ["4", "public inputs"],
                  ["8", "leaf demo tree"],
                ].map(([n, l]) => (
                  <div key={l} className="rounded-lg border border-hairline bg-canvas-soft p-md">
                    <p className="tnum text-display-md font-light text-ink">{n}</p>
                    <p className="text-caption text-ink-mute">{l}</p>
                  </div>
                ))}
              </dl>
            </div>
            <MiniDemo />
          </div>
        </Reveal>
      </section>

      {/* ── The problem ──────────────────────────────────────── */}
      <section className="border-y border-hairline bg-canvas-soft">
        <div className="mx-auto max-w-container px-lg py-huge">
          <Reveal>
            <h2 className="text-display-lg text-ink">Accreditation costs you your privacy.</h2>
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

      {/* ── The product (3-step) ─────────────────────────────── */}
      <section className="mx-auto max-w-container px-lg py-huge">
        <Reveal>
          <h2 className="text-display-lg text-ink">Issuer commits. You prove. The pool unlocks.</h2>
          <p className="mt-md max-w-[52ch] text-body-lg text-ink-secondary">
            Three steps. The issuer never sees your secret. The ledger never sees your identity.
          </p>
        </Reveal>
        <div className="mt-xl">
          <StepFlow />
        </div>
      </section>

      {/* ── Live stats ───────────────────────────────────────── */}
      <LiveStats />

      {/* ── Trust strip ──────────────────────────────────────── */}
      <section className="mx-auto max-w-container px-lg py-huge">
        <Reveal>
          <p className="text-micro-cap uppercase tracking-wide text-ink-mute">Built on, credited to</p>
          <TrustStrip />
        </Reveal>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-hairline">
        <div className="mesh-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-container px-lg py-huge text-center">
          <Reveal>
            <h2 className="mx-auto max-w-[20ch] text-display-xl text-ink">Try the demo pool from one device.</h2>
            <p className="mx-auto mt-md max-w-[44ch] text-body-lg text-ink-secondary">
              Accredit yourself, prove in the browser, subscribe on testnet, and verify it independently. No real
              money is involved.
            </p>
            <div className="mt-xl flex justify-center">
              <Button asChild size="lg">
                <Link href="/invest">
                  Launch the app <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
