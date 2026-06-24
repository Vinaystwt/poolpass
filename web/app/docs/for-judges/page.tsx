import { Prose, H1, Lead, H2, P, Mono, CodeBlock, Callout } from "@/components/docs/prose";

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
    </Prose>
  );
}
