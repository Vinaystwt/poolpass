import Link from "next/link";
import {
  ArrowRight,
  FileLock2,
  Clock4,
  Globe2,
  ListChecks,
  ShieldCheck,
  Cpu,
  Wallet,
  X,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/reveal";
import { MiniDemoLazy } from "@/components/landing/mini-demo-lazy";
import { LiveStats } from "@/components/landing/live-stats";
import { TrustStrip } from "@/components/landing/trust-strip";
import { WalkthroughButton } from "@/components/walkthrough";

const PARITY_HASH = "115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a";
const GATE_A_TX = "94e5d8b1a6161bea6581b305c522981d2674ac87db49bc6263126d7b3167e4d5";
const GATE_B_TX = "593c2516f1c8b431a0ff8cf09a82ba92eb467bfb0e6f1b72099bfb25d0490ee1";

const VERBS = [
  { icon: ListChecks, title: "Choose a pool", body: "Three pools: treasury, credit, venture. Each has its own gate and cap." },
  { icon: ShieldCheck, title: "Get accredited", body: "Join the issuer's list. Your details stay on your device." },
  { icon: Cpu, title: "Prove privately", body: "Your browser makes the proof in about a second. No wallet needed." },
  { icon: Wallet, title: "Subscribe", body: "Sign once with your wallet. The pool settles on Stellar." },
];

const WITHOUT = [
  "Send identity documents to every issuer",
  "Disclose your net worth and bank statements",
  "Your data sits in issuer databases forever",
  "Weeks of re-verification per pool",
];

const WITH = [
  "Send one 256-byte proof",
  "Reveal nothing about who you are",
  "The issuer never sees your private data",
  "Subscribe in seconds, verified on-chain",
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
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="mesh-bg mesh-anim pointer-events-none absolute inset-x-0 top-0 h-[460px]" />
        <div className="relative mx-auto max-w-container px-lg pb-huge pt-xxl">
          <div className="grid items-center gap-xl lg:grid-cols-[1fr_0.92fr]">
            <div>
              <Badge variant="neutral">Real-world investing, kept private</Badge>
              <h1 className="mt-lg text-display-xxl text-balance text-ink">Prove you qualify. Reveal nothing.</h1>
              <p className="mt-lg max-w-[54ch] text-body-lg text-ink">
                Invest in tokenized treasury, credit, and venture pools on Stellar. Prove you are an eligible
                investor with a single zero-knowledge proof. Your identity and your wealth never touch the chain.
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
                <WalkthroughButton />. Testnet only, uses Testnet USDC, a 7-decimal token, not Circle USDC. No
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
        <div className="mx-auto max-w-container px-lg py-huge">
          <h2 className="text-display-md text-ink">Four steps, that is the whole product.</h2>
          <div className="mt-lg grid gap-lg sm:grid-cols-2 lg:grid-cols-4">
            {VERBS.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.05}>
                <div className="flex h-full flex-col rounded-lg border border-hairline bg-card p-lg shadow-e1">
                  <div className="flex items-center gap-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-caption font-semibold text-primary">{i + 1}</span>
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

      {/* ── Without / With comparison ── */}
      <section className="mx-auto max-w-container px-lg py-huge">
        <Reveal>
          <h2 className="text-display-lg text-ink">Why this matters</h2>
          <div className="mt-xl grid gap-lg md:grid-cols-2">
            <div className="rounded-xl border border-ruby/20 bg-ruby/5 p-xl">
              <p className="text-heading-sm text-ruby">Without PoolPass</p>
              <ul className="mt-md flex flex-col gap-sm">
                {WITHOUT.map((line) => (
                  <li key={line} className="flex items-start gap-sm text-body-md text-ink-secondary">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-ruby" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-xl">
              <p className="text-heading-sm text-emerald-600 dark:text-emerald-400">With PoolPass</p>
              <ul className="mt-md flex flex-col gap-sm">
                {WITH.map((line) => (
                  <li key={line} className="flex items-start gap-sm text-body-md text-ink-secondary">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Verified natively on Stellar (Gate A/B parity) ── */}
      <section className="border-y border-hairline bg-canvas-soft">
        <div className="mx-auto max-w-container px-lg py-huge">
          <Reveal>
            <Badge variant="proof">Verified natively on Stellar</Badge>
            <h2 className="mt-md text-display-lg text-ink">Why this is hard, and why it works</h2>
            <p className="mt-md max-w-[64ch] text-body-lg text-ink-secondary">
              PoolPass verifies Groth16 proofs natively using Stellar Protocol 25/26 BN254 and Poseidon host
              functions. No userland WASM. No off-chain oracle.
            </p>
            <div className="mt-xl grid gap-lg md:grid-cols-2">
              <div className="rounded-xl border border-hairline bg-card p-xl shadow-e1">
                <p className="text-heading-sm text-accent-proof">Gate A: Poseidon parity</p>
                <p className="mt-xs text-body-md text-ink-secondary">
                  For the same input, three independent implementations produce byte-identical output:
                </p>
                <div className="mt-md rounded-lg bg-canvas-sunken p-md">
                  <p className="text-micro-cap uppercase tracking-wide text-ink-mute">Off-chain library / Circuit witness / On-chain host</p>
                  <p className="mt-xs break-all font-mono text-[13px] leading-relaxed text-ink">{PARITY_HASH}</p>
                </div>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${GATE_A_TX}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-md inline-flex items-center gap-xs text-caption text-primary hover:underline"
                >
                  Verify on Stellar Expert <ArrowRight className="h-3 w-3" />
                </a>
              </div>
              <div className="rounded-xl border border-hairline bg-card p-xl shadow-e1">
                <p className="text-heading-sm text-accent-proof">Gate B: Native Groth16 verification</p>
                <p className="mt-xs text-body-md text-ink-secondary">
                  BN254 pairing check passed on-chain through a single native host call. No contract reimplements
                  the curve arithmetic.
                </p>
                <div className="mt-md rounded-lg bg-canvas-sunken p-md">
                  <p className="text-micro-cap uppercase tracking-wide text-ink-mute">On-chain pairing result</p>
                  <p className="mt-xs font-mono text-[13px] text-emerald-600 dark:text-emerald-400">bn254_pairing_check: PASS</p>
                </div>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${GATE_B_TX}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-md inline-flex items-center gap-xs text-caption text-primary hover:underline"
                >
                  Verify on Stellar Expert <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </Reveal>
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

      {/* ── Why Stellar ── */}
      <section className="mx-auto max-w-container px-lg py-huge">
        <Reveal>
          <div className="rounded-xl border border-hairline bg-card p-xl shadow-e1">
            <div className="flex items-center gap-sm">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-display-md text-ink">Only possible on Stellar</h2>
            </div>
            <p className="mt-md max-w-[64ch] text-body-lg text-ink-secondary">
              Stellar Protocol 25 (X-Ray) and 26 (Yardstick) introduced native BN254 and Poseidon host functions,
              making Groth16 verification affordable on-chain for the first time.
            </p>
            <p className="mt-sm max-w-[64ch] text-body-md text-ink-mute">
              PoolPass uses these primitives directly. No WASM reimplementation, no off-chain oracle, no L2.
              This is why we built on Stellar, and why this hackathon exists.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── Trust strip ── */}
      <section className="mx-auto max-w-container px-lg pb-huge">
        <Reveal>
          <p className="text-micro-cap uppercase tracking-wide text-ink-mute">Built on, credited to</p>
          <TrustStrip />
        </Reveal>
      </section>
    </div>
  );
}
