import { Prose, H1, Lead, H2, H3, P, UL, Mono, CodeBlock, Callout } from "@/components/docs/prose";

export const metadata = { title: "PoolPass docs: For judges" };

const PARITY = "115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a";
const LINKS: { label: string; tx: string }[] = [
  { label: "Gate A, Poseidon parity (forced host invocation)", tx: "94e5d8b1a6161bea6581b305c522981d2674ac87db49bc6263126d7b3167e4d5" },
  { label: "Gate B, native BN254 Groth16 verification", tx: "593c2516f1c8b431a0ff8cf09a82ba92eb467bfb0e6f1b72099bfb25d0490ee1" },
  { label: "Real subscription with exact balance assertions", tx: "c0ed392e0aea922790676010e0a13e4a4d6f5de7b0878e1b08ae9d79b0bfaa51" },
  { label: "Same-nullifier replay, finalized FAILED, code 5", tx: "9713c9fe80bb3737e308580bee8f45619be5ef0620f2cd6953b781c2900d7a36" },
  { label: "Leaf-only self-serve accreditation", tx: "b8394e5c4cb75db7689450c2fb96b979262b73241cacd5a310c3543746ca28fd" },
  { label: "Fresh-address subscription", tx: "a3950d75ec2203d33949d4c7c05ba72b78d638361598060f8b9eac91d3baa0dd" },
];

export default function ForJudges() {
  return (
    <Prose>
      <H1>How to verify our claims</H1>
      <Lead>
        Sixty seconds, no trust required. Run three commands, visit three URLs, check one hex string, and follow the
        explorer links to the verified on-chain runs.
      </Lead>

      <H2 id="commands">Three commands</H2>
      <CodeBlock lang="terminal">{`# 1 · prove + verify a proof against the committed key, off any browser
pnpm api            # start services on http://127.0.0.1:3000
pnpm api:smoke      # exercises /accredit, /prove, /verify end to end

# 2 · confirm Poseidon parity (off-chain == circuit == on-chain host)
pnpm gate:a

# 3 · run the full self-serve loop on testnet
pnpm selfserve:smoke`}</CodeBlock>

      <H2 id="urls">Three URLs</H2>
      <P>No wallet required for any of these:</P>
      <CodeBlock>{`/prove                  run a real Groth16 proof in your browser (~1 s)
/verify/<tx-or-commitment>   independently verify any subscription
/docs/host-functions    the Gate A parity witness, verbatim`}</CodeBlock>

      <H2 id="parity">One hex string to check</H2>
      <Callout tone="proof" title="Poseidon parity, three identical outputs">
        <p>
          For the input pair <Mono>&quot;1&quot;, &quot;2&quot;</Mono>, the off-chain library, the Circom witness, and the
          Soroban host all return:
        </p>
        <p>
          <Mono>{PARITY}</Mono>
        </p>
        <p>Byte-identical across all three. No contract contains userland Poseidon or BN254 arithmetic.</p>
      </Callout>

      <H2 id="explorer">Explorer links, verified on-chain runs</H2>
      <div className="flex flex-col gap-xs">
        {LINKS.map((l) => (
          <a
            key={l.tx}
            href={`https://stellar.expert/explorer/testnet/tx/${l.tx}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-md border border-hairline bg-canvas-soft px-md py-sm text-body-md text-ink transition-colors hover:border-primary"
          >
            <span>{l.label}</span>
            <span className="mono text-[12px] text-primary">{l.tx.slice(0, 6)}…{l.tx.slice(-4)}</span>
          </a>
        ))}
      </div>

      <H2 id="why-poolpass">Why PoolPass beats simpler alternatives</H2>
      <H3 id="not-semaphore">Not just set membership</H3>
      <P>
        PoolPass composes set membership (Merkle inclusion), range compliance (amount within cap), a privacy-preserving
        nullifier (one subscription per epoch per secret), and real settlement (Testnet USDC transfer plus pool-token
        mint) inside one atomic Soroban invocation. Simpler ZK demos verify a proof and stop. PoolPass verifies and
        settles: the contract transfers tokens, mints a pool receipt, and records the commitment in a single
        transaction.
      </P>
      <H3 id="gate-a-matters">Gate A parity work matters</H3>
      <P>
        Most submissions skip cryptographic parity testing. A userland-Poseidon submission could ship a subtle parameter
        mismatch between the off-chain library and the on-chain implementation and never know until a proof silently
        fails. PoolPass forced the native host invocation and proved byte-identical output across three independent
        implementations: the circomlib JS library, the Circom circuit witness, and the Soroban Poseidon host function.
        That is the engineering rigor a production system needs, and it is verifiable on-chain.
      </P>
      <H3 id="native-host">Native host functions, not WASM fallback</H3>
      <P>
        The Groth16 verification runs through Stellar Protocol 25/26{" "}
        <Mono>bn254_pairing_check</Mono>, not a WASM contract reimplementation of BN254 arithmetic. This is cheaper,
        faster, and exactly the use case the protocol upgrades were designed for. The Poseidon hashing likewise uses the
        native <Mono>poseidon_hash</Mono> host function introduced in Protocol 25. No contract in the system contains
        userland elliptic-curve or hash arithmetic.
      </P>

      <H2 id="threat-model">Threat model and honest limits</H2>
      <UL>
        <li>
          <strong>Self-serve issuer.</strong> The accreditation gate is simulated for the demo. A real deployment
          requires the issuer to perform KYC/AML before committing a leaf. The ZK proof verifies membership in whatever
          set the issuer commits, but the integrity of that set depends on the issuer&rsquo;s off-chain process.
        </li>
        <li>
          <strong>Trusted setup.</strong> The Groth16 parameters are a test fixture generated for this demo. A mainnet
          deployment requires a Phase-2 ceremony (Powers of Tau) to eliminate the trapdoor risk.
        </li>
        <li>
          <strong>Public inputs.</strong> The subscription amount is a public input and is visible on-chain. The
          commitment does not hide the amount.
        </li>
        <li>
          <strong>Timing correlation.</strong> The on-chain wallet address and the timing of subscriptions are
          observable. Cross-epoch linkability is mitigated by the investor_secret in the nullifier, but intra-epoch
          timing is a leak.
        </li>
        <li>
          <strong>Issuer centralization.</strong> The issuer service is a single point of trust for tree commitments. A
          production system would use a multisig or an on-chain governance mechanism.
        </li>
        <li>
          <strong>Merkle depth.</strong> Depth-3 (8 leaves) is demo scale. Production requires depth 16 to 20 (65K to
          1M leaves). The circuit is parameterized for depth but compiled for 3; scaling requires recompilation and a
          new trusted setup.
        </li>
      </UL>
    </Prose>
  );
}
