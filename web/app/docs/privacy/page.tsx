import { Prose, H1, Lead, H2, P, UL, Mono, Callout, Table } from "@/components/docs/prose";
import { Toc } from "@/components/docs/toc";

export const metadata = { title: "PoolPass docs: Privacy & security" };

export default function Privacy() {
  return (
    <Prose>
      <H1>Privacy & security model</H1>
      <Lead>
        Be precise about what is hidden and what is not. PoolPass hides the link between a subscription and an identity.
        It does not hide the amount, the timing, or the on-chain wallet.
      </Lead>

      <Toc />

      <H2 id="who-sees">Who sees what</H2>
      <Table
        head={["Value", "Investor", "Issuer", "Contract", "Public observer"]}
        rows={[
          ["investor_id", "✓", "✓", "·", "·"],
          ["cap", "✓", "✓", "·", "·"],
          ["investor_secret", "✓", "·", "·", "·"],
          ["leaf", "✓", "✓", "via root", "·"],
          ["merkle_root", "✓", "✓", "✓", "✓"],
          ["amount", "✓", "✓", "✓", "✓"],
          ["nullifier", "✓", "·", "✓", "✓"],
          ["commitment", "✓", "·", "✓", "✓"],
          ["subscribing wallet", "✓", "✓", "✓", "✓"],
        ]}
      />

      <Callout tone="warn" title="What is NOT hidden">
        <p>
          The <Mono>amount</Mono> is a public input, the commitment over the amount does not hide it. The timing of a
          subscription is observable. The on-chain identity of the subscribing wallet is visible to everyone. If a wallet
          is already linked to a real-world identity, the subscription is too.
        </p>
      </Callout>

      <H2 id="what-issuer">What the issuer knows</H2>
      <P>
        Everything about its own investors. The issuer builds the tree, so it holds every <Mono>investor_id</Mono> and{" "}
        <Mono>cap</Mono>. The privacy guarantee is against the public ledger and third parties, not against the issuer
        that accredited you. This is the correct trust model for a regulated pool: the issuer keeps its audit trail.
      </P>

      <H2 id="linkability">Cross-epoch linkability</H2>
      <P>
        The nullifier is <Mono>Poseidon2(investor_secret, epoch)</Mono>. Because the secret is folded in with the epoch,
        an investor&rsquo;s nullifier in epoch 1 and epoch 2 are unlinkable without the secret, a public observer cannot
        tell that the same investor subscribed in two different epochs. Within one epoch, the nullifier prevents a double
        subscription: a replay finalizes <Mono>FAILED</Mono> with <Mono>NullifierUsed</Mono>.
      </P>

      <H2 id="assumptions">Security assumptions</H2>
      <UL>
        <li>
          <strong>Discrete log on BN254.</strong> Groth16 soundness rests on the hardness of the discrete logarithm in
          the BN254 pairing groups. BN254 targets roughly 100-bit security, adequate for a testnet build, and a known
          consideration for a mainnet curve choice.
        </li>
        <li>
          <strong>Poseidon collision resistance.</strong> Leaf, nullifier, and commitment integrity depend on Poseidon
          being collision-resistant over BN254 Fr with the stated round parameters.
        </li>
        <li>
          <strong>Groth16 trusted setup.</strong> This build uses a Phase-1 (powers-of-tau) hackathon setup, not a
          ceremony-grade Phase-2. A leaked toxic-waste value would let a forger mint proofs. A multi-party Phase-2
          ceremony is on the roadmap before any mainnet deployment.
        </li>
      </UL>

      <Callout title="Honest framing">
        <p>
          Anyone can verify a subscription; no one is asked to trust the team. The trust you do extend is to the issuer
          (which accredited you) and to the trusted-setup assumption (which the roadmap addresses with a public
          ceremony).
        </p>
      </Callout>
    </Prose>
  );
}
