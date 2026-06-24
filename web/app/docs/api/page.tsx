import { Prose, H1, Lead, H2, P, Mono, CodeBlock, Callout } from "@/components/docs/prose";

export const metadata = { title: "PoolPass docs: API" };

export default function ApiDocs() {
  return (
    <Prose>
      <H1>HTTP API</H1>
      <Lead>
        The PoolPass services run locally with <Mono>pnpm api</Mono> (default <Mono>http://127.0.0.1:3000</Mono>). The
        frontend reaches them through same-origin proxy routes under <Mono>/api</Mono>. JSON bodies are strict;
        extra secret-bearing fields are rejected.
      </Lead>

      <H2 id="accredit">POST /accredit</H2>
      <P>Send only the 32-byte leaf hash. The demo issuer commits all eight leaves on chain and returns the path.</P>
      <CodeBlock lang="curl">{`curl -s http://127.0.0.1:3000/accredit \\
  -H 'content-type: application/json' \\
  -d '{"leaf":"<64 lowercase hex>"}'

# -> { leaf, root, epoch, index, merkle_path[3], merkle_indices[3] }`}</CodeBlock>

      <H2 id="faucet">POST /faucet</H2>
      <P>Mints Mock USDC to an address. Amount optional, in base units, capped at 100,000,000,000 (10,000 mUSDC).</P>
      <CodeBlock lang="curl">{`curl -s http://127.0.0.1:3000/faucet \\
  -H 'content-type: application/json' \\
  -d '{"address":"G...","amount":"10000000000"}'`}</CodeBlock>

      <H2 id="verify">POST /verify</H2>
      <P>Verifies a proof against the committed PoolPass verifying key. The server ignores caller key substitution.</P>
      <CodeBlock lang="curl">{`curl -s http://127.0.0.1:3000/verify \\
  -H 'content-type: application/json' \\
  -d '{"proof":<snarkjs proof>,"publicSignals":[<4 strings>]}'

# -> { "valid": true }`}</CodeBlock>

      <H2 id="prove">POST /prove, fallback only</H2>
      <Callout tone="warn" title="This endpoint is the fallback, not the default">
        <p>
          <Mono>/prove</Mono> necessarily receives <Mono>investor_id</Mono>, <Mono>cap</Mono>, and{" "}
          <Mono>investor_secret</Mono> in plaintext. The default user route is in-browser proving with snarkjs. Use{" "}
          <Mono>/prove</Mono> only when a client cannot run snarkjs fast enough, and only after an explicit opt-in.
        </p>
      </Callout>
      <CodeBlock lang="curl">{`curl -s http://127.0.0.1:3000/prove \\
  -H 'content-type: application/json' \\
  -d '{"input":{ ...all circuit signals... }}'

# -> { "proof": <snarkjs proof>, "publicSignals": [<4 strings>] }`}</CodeBlock>

      <H2 id="pool">GET /pool/demo</H2>
      <P>Returns live <Mono>PoolInfo</Mono> plus <Mono>{`{ id: "demo", contractId }`}</Mono>.</P>
      <CodeBlock lang="curl">{`curl -s http://127.0.0.1:3000/pool/demo`}</CodeBlock>
    </Prose>
  );
}
