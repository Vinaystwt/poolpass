import Link from "next/link";
import { ArrowRight, Cpu, ShieldCheck, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "PoolPass — Demo" };

const STEPS = [
  { icon: Cpu, title: "Run a proof", body: "Generate a real Groth16 proof in your browser in about a second. No wallet.", href: "/prove", cta: "Open the prover" },
  { icon: Wallet, title: "Subscribe privately", body: "Accredit yourself, prove, and subscribe to the demo pool on testnet.", href: "/invest", cta: "Open the app" },
  { icon: ShieldCheck, title: "Verify it", body: "Independently confirm any subscription against the on-chain proof.", href: "/verify/a3950d75ec2203d33949d4c7c05ba72b78d638361598060f8b9eac91d3baa0dd", cta: "Open a verification" },
];

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-container px-lg py-xxl">
      <Badge variant="proof">Demo</Badge>
      <h1 className="mt-lg text-display-lg text-ink">See the whole loop in two minutes.</h1>
      <p className="mt-md max-w-[58ch] text-body-lg text-ink-secondary">
        Rather than watch a video, run it. Each step below is live on testnet — jump in wherever you like.
      </p>

      <div className="mt-xl grid gap-lg md:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.title} className="flex flex-col rounded-lg border border-hairline bg-card p-xl shadow-e1">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-proof/10">
              <s.icon className="h-5 w-5 text-accent-proof" />
            </span>
            <h2 className="mt-md text-heading-md text-ink">{s.title}</h2>
            <p className="mt-xs flex-1 text-body-md text-ink-secondary">{s.body}</p>
            <Button asChild variant="secondary" size="sm" className="mt-md self-start">
              <Link href={s.href}>
                {s.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-huge rounded-xl border border-hairline bg-canvas-soft p-xl text-center">
        <p className="text-body-lg text-ink-secondary">Ready to try the real thing?</p>
        <Button asChild size="lg" className="mt-md">
          <Link href="/invest">
            Launch the app <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
