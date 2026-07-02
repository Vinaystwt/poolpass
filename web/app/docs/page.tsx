import { Prose, H1, Lead, H2, P, UL, Mono, Callout } from "@/components/docs/prose";
import { Badge } from "@/components/ui/badge";
import { MOCK_USDC, CONTRACTS } from "@/lib/backend-config";
import { HashChip } from "@/components/shared/copy";

export const metadata = { title: "PoolPass docs: Introduction" };

export default function DocsIntro() {
  return (
    <Prose>
      <Badge variant="proof">Documentation</Badge>
      <H1>PoolPass</H1>
      <Lead>
        PoolPass lets an investor subscribe to a gated real-world-asset pool on Stellar by proving they belong to an
        issuer&rsquo;s accredited set, without revealing who they are, how much they hold, or who else is on the list.
        The proof is a 256-byte Groth16 proof, verified natively on chain.
      </Lead>

      <H2 id="who">Who it is for</H2>
      <UL>
        <li>
          <strong>Investors</strong> who want to subscribe to a regulated pool without handing an issuer their identity
          and net worth.
        </li>
        <li>
          <strong>Issuers</strong> who must gate a pool to accredited participants while keeping their investor list
          private and preserving an audit trail.
        </li>
        <li>
          <strong>Regulators and auditors</strong> who need a verifiable record that every subscriber was authorized,
          without a public roster.
        </li>
      </UL>

      <H2 id="does">What it does, and does not, do</H2>
      <UL>
        <li>It proves Merkle membership in a committed accredited set, a range bound on the amount, and a per-epoch nullifier.</li>
        <li>It does not hide the subscription amount, the amount is a public input by design.</li>
        <li>It does not hide the timing of a subscription or the on-chain wallet that submits it.</li>
        <li>It does not yet run a multi-issuer pool factory; one verified demo pool runs the full loop today.</li>
      </UL>

      <H2 id="testnet">Testnet and Testnet USDC</H2>
      <P>
        Everything here runs on Stellar testnet, protocol 27. Settlement uses{" "}
        <strong>{MOCK_USDC.labelLong}</strong>, a custom 7-decimal token deployed for this build, not Circle USDC. No
        real money moves. After the first mention we call it <Mono>{MOCK_USDC.labelShort}</Mono> or{" "}
        <Mono>{MOCK_USDC.ticker}</Mono>. Mainnet Circle USDC integration is on the roadmap.
      </P>

      <Callout tone="proof" title="The one idea">
        <p>
          Prove you qualify. Reveal nothing. The issuer knows everything about its own investors; the public ledger sees
          only a nullifier and a commitment.
        </p>
      </Callout>

      <P>
        The deployed PoolPass contract is <HashChip value={CONTRACTS.poolpass} full />.
      </P>
    </Prose>
  );
}
