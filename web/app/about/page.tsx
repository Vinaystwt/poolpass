import { Github, Twitter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TrustStrip } from "@/components/landing/trust-strip";

export const metadata = { title: "PoolPass — About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[760px] px-lg py-xxl">
      <Badge variant="proof">About</Badge>

      <section className="mt-lg">
        <h1 className="text-display-lg text-ink">Real-world money deserves real-world privacy.</h1>
        <p className="mt-lg text-body-lg text-ink-secondary">
          PoolPass lets an investor join a gated real-world-asset pool on Stellar by proving they qualify — not by
          surrendering their identity and their balance sheet. We built it because the gate between a regulated issuer
          and a private subscriber is unsolved, and because Stellar just shipped the host functions that make solving it
          on chain cheap.
        </p>
        <p className="mt-md text-body-lg text-ink-secondary">
          Our thesis: as tokenized treasuries, credit, and funds move on chain, the accreditation step cannot keep
          leaking private financial data into a dozen issuer CRMs. A 256-byte proof replaces the disclosure. The
          investor stays private, the issuer keeps its audit trail, and a regulator can still confirm every subscriber
          was authorized.
        </p>
      </section>

      <section className="mt-huge">
        <h2 className="text-display-md text-ink">Why now</h2>
        <p className="mt-md text-body-md text-ink-secondary">
          Stellar Protocol 25 (X-Ray) and 26 (Yardstick) shipped native BN254 and Poseidon host functions. Groth16
          verification that was impossibly expensive in userland WASM is now a single priced host call.
        </p>
        <p className="mt-md text-body-md text-ink-secondary">
          More than $2B in tokenized real-world assets already lives on Stellar. The demand is here; the rails are here.
        </p>
        <p className="mt-md text-body-md text-ink-secondary">
          And the gap between &ldquo;regulated issuer&rdquo; and &ldquo;private subscriber&rdquo; is unresolved
          everywhere else. That gap is the whole product.
        </p>
      </section>

      <section className="mt-huge">
        <h2 className="text-display-md text-ink">Team</h2>
        <div className="mt-lg rounded-lg border border-hairline bg-card p-xl shadow-e1">
          <div className="flex items-center gap-md">
            <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-primary/10 text-heading-md text-primary">
              V
            </span>
            <div>
              <p className="text-heading-md text-ink">Vinay</p>
              <p className="text-caption text-ink-mute">Deon Labs · solo hackathon build</p>
            </div>
          </div>
          <p className="mt-md text-body-md text-ink-secondary">
            One builder, one pass: the Soroban contracts, the Circom circuit and trusted-setup artifacts, the indexer and
            services, and this frontend. Honest framing — this is a hackathon build on testnet, with mainnet plans laid
            out on the roadmap, not a finished product pretending to be one.
          </p>
          <div className="mt-md flex gap-sm">
            <a
              href="https://github.com/Vinaystwt"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-xs rounded-pill border border-hairline px-md py-xs text-body-md text-ink transition-colors hover:border-primary"
            >
              <Github className="h-4 w-4" /> @Vinaystwt
            </a>
            <a
              href="https://twitter.com/vinaystwt"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-xs rounded-pill border border-hairline px-md py-xs text-body-md text-ink transition-colors hover:border-primary"
            >
              <Twitter className="h-4 w-4" /> @vinaystwt
            </a>
          </div>
        </div>
      </section>

      <section className="mt-huge">
        <h2 className="text-display-md text-ink">Built on</h2>
        <TrustStrip />
      </section>
    </div>
  );
}
