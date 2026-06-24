import { Prose, H1, Lead, H2, P, UL, Mono } from "@/components/docs/prose";

export const metadata = { title: "PoolPass docs — Theory" };

export default function Theory() {
  return (
    <Prose>
      <H1>Why zero-knowledge fits</H1>
      <Lead>
        Accreditation is a yes/no fact backed by private data. A zero-knowledge proof carries the yes without the data —
        which is exactly the shape of the problem.
      </Lead>

      <H2 id="friction">The friction it removes for investors</H2>
      <P>
        Today an investor proves they qualify by disclosing identity and net worth to each issuer, who stores it. PoolPass
        replaces the disclosure with a proof. The investor computes <Mono>Poseidon3(investor_id, cap, investor_secret)</Mono>{" "}
        once, hands the issuer only that leaf, and from then on proves membership without re-revealing anything.
      </P>

      <H2 id="audit">The audit trail it preserves for issuers</H2>
      <P>
        The issuer keeps everything it needs. It built the tree, so it can map any leaf back to a real investor for its
        own compliance. The public ledger, meanwhile, holds only nullifiers and commitments. A regulator can be shown a
        proof that every subscriber was authorized — without a public roster of who they are.
      </P>

      <H2 id="split">What each party learns</H2>
      <UL>
        <li>
          <strong>The issuer</strong> learns nothing new at subscription time — it already knows its investors.
        </li>
        <li>
          <strong>The contract</strong> learns that a valid member subscribed a public amount in this epoch, and that the
          nullifier is fresh.
        </li>
        <li>
          <strong>A public observer</strong> learns a wallet subscribed an amount, plus an opaque nullifier and
          commitment — and cannot link the subscription to an identity or across epochs.
        </li>
      </UL>

      <P>
        The proof is the contract between these three views: it lets the contract enforce the issuer&rsquo;s rule while
        showing the public almost nothing. That is the property no plaintext allowlist can offer.
      </P>
    </Prose>
  );
}
