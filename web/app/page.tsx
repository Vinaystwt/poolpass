import Link from "next/link";
import { ArrowRight, FileLock2, Clock4, Globe2, ListChecks, ShieldCheck, Cpu, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/reveal";
import { MiniDemoLazy } from "@/components/landing/mini-demo-lazy";
import { LiveStats } from "@/components/landing/live-stats";
import { TrustStrip } from "@/components/landing/trust-strip";
import { WalkthroughButton } from "@/components/walkthrough";

const VERBS = [
  { icon: ListChecks, title: "Choose a pool", body: "Three real pools, each with its own gate and cap." },
  { icon: ShieldCheck, title: "Get accredited", body: "Join the issuer's list. Your details stay on your device." },
  { icon: Cpu, title: "Prove privately", body: "Your browser makes the proof in about a second. No wallet needed." },
  { icon: Wallet, title: "Subscribe", body: "Sign once with your wallet. The pool settles on Stellar." },
];

const PROBLEMS = [
  {
    icon: FileLock2,
    title: "Your statements end up in databases",
    body: "Proving you qualify usually means handing an issuer your identity and your net worth. That data sits in a database forever.",
    source: "SEC accredited-investor rule, 17 CFR 230.501",
    href: "https://www.sec.gov/education/capitalraising/building-blocks/accredited-investor",
  },
  {
    icon: Clock4,
    title: "You repeat it for every issuer",
    body: "Every pool re-runs the same check. You disclose the same private information again and again.",
    source: "Industry accreditation workflows",
    href: "https://www.sec.gov/education/capitalraising/building-blocks/accredited-investor",
  },
  {
    icon: Globe2,
    title: "Real assets, retail mostly shut out",
    body: "Real-world assets are already on Stellar. The gate between a regulated issuer and a private investor is unsolved everywhere else.",
    source: "Stellar tokenized-asset ecosystem",
    href: "https://stellar.org/products-and-services/real-world-assets",
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* ── Hero: plain meaning left, live proof right, above the fold ── */}
      <section className="relative overflow-hidden">
        <div className="mesh-bg mesh-anim pointer-events-none absolute inset-x-0 top-0 h-[460px]" />
        <div className="relative mx-auto max-w-container px-lg pb-xxl pt-xxl">
          <div className="grid items-center gap-xl lg:grid-cols-[1fr_0.92fr]">
            <div>
              <Badge variant="neutral">Real-world investing, kept private</Badge>
              <h1 className="mt-lg text-display-xxl text-balance text-ink">Prove you qualify. Reveal nothing.</h1>
              <p className="mt-lg max-w-[52ch] text-body-lg text-ink-secondary">
                Join a gated real-world-asset pool on Stellar by proving you belong. It is like showing you are on the
                guest list without showing your ID.
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
                <WalkthroughButton />. Testnet only, uses Mock USDC (testnet), a 7-decimal token, not Circle USDC. No
                real money moves.
              </p>
            </div>
            <Reveal delay={0.08}>
              <MiniDemoLazy />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Four-verb mental model ── */}
      <section id="four-verbs" className="border-y border-hairline bg-canvas-soft">
        <div className="mx-auto max-w-container px-lg py-xxl">
          <h2 className="text-display-md text-ink">Four steps, that is the whole product.</h2>
          <div className="mt-lg grid gap-lg sm:grid-cols-2 lg:grid-cols-4">
            {VERBS.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.05}>
                <div className="flex h-full flex-col rounded-lg border border-hairline bg-card p-lg">
                  <div className="flex items-center gap-sm">
                    <span className="tnum text-caption text-ink-mute">{i + 1}</span>
                    <v.icon className="h-4 w-4 text-ink-secondary" />
                  </div>
                  <h3 className="mt-sm text-heading-sm text-ink">{v.title}</h3>
                  <p className="mt-xxs text-body-md text-ink-mute">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── The problem ── */}
      <section className="mx-auto max-w-container px-lg py-huge">
        <Reveal>
          <h2 className="text-display-lg text-ink">Accreditation costs you your privacy.</h2>
          <p className="mt-md max-w-[52ch] text-body-lg text-ink-secondary">
            Here is what the proof is for.
          </p>
        </Reveal>
        <div className="mt-xl grid gap-lg md:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.05}>
              <div className="flex h-full flex-col rounded-lg border border-hairline bg-card p-xl shadow-e1">
                <p.icon className="h-5 w-5 text-ink-secondary" />
                <h3 className="mt-md text-heading-md text-ink">{p.title}</h3>
                <p className="mt-sm flex-1 text-body-md text-ink-secondary">{p.body}</p>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-md text-micro text-ink-mute underline decoration-dotted underline-offset-2 hover:text-ink"
                >
                  {p.source}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works (diagram carries it) ── */}
      <section className="border-y border-hairline bg-canvas-soft">
        <div className="mx-auto max-w-container px-lg py-huge">
          <Reveal>
            <h2 className="text-display-lg text-ink">Issuer commits. You prove. The pool unlocks.</h2>
            <p className="mt-md max-w-[60ch] text-body-lg text-ink-secondary">
              The issuer publishes a fingerprint of its approved list. You prove you are on it, in your browser. Stellar
              checks the proof and settles, and the ledger never learns who you are.
            </p>
            <div className="mt-xl overflow-x-auto rounded-xl border border-hairline">
              <img src="/diagrams/how-it-works.svg" alt="How PoolPass works, end to end" className="h-auto w-full min-w-[680px]" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What stays private ── */}
      <section className="mx-auto max-w-container px-lg py-huge">
        <Reveal>
          <Badge variant="proof">What stays private</Badge>
          <h2 className="mt-md text-display-lg text-ink">Your details never leave your device.</h2>
          <p className="mt-md max-w-[60ch] text-body-lg text-ink-secondary">
            The proof is the only thing that crosses the wire. It convinces anyone that you qualify while revealing
            nothing about you.
          </p>
          <div className="mt-xl overflow-x-auto rounded-xl border border-hairline">
            <img src="/diagrams/privacy-split.svg" alt="What stays on your device versus what becomes public" className="h-auto w-full min-w-[680px]" />
          </div>
        </Reveal>
      </section>

      {/* ── Live stats ── */}
      <LiveStats />

      {/* ── Try it ── */}
      <section className="border-y border-hairline bg-canvas-soft">
        <div className="mx-auto max-w-container px-lg py-huge text-center">
          <Reveal>
            <h2 className="mx-auto max-w-[22ch] text-display-lg text-ink">Three real pools. Pick one and subscribe.</h2>
            <p className="mx-auto mt-md max-w-[52ch] text-body-lg text-ink-secondary">
              Each pool has its own gate and cap, all on Stellar testnet. Inspect the gate, watch the live subscribers,
              then subscribe privately.
            </p>
            <div className="mt-xl flex justify-center">
              <Button asChild size="lg">
                <Link href="/invest">
                  Open the marketplace <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="mx-auto max-w-container px-lg py-huge">
        <Reveal>
          <p className="text-micro-cap uppercase tracking-wide text-ink-mute">Built on, credited to</p>
          <TrustStrip />
        </Reveal>
      </section>
    </div>
  );
}
