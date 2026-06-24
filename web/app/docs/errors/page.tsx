import { Prose, H1, Lead, H2, P, UL, Mono, Table, Callout } from "@/components/docs/prose";
import { ERROR_TABLE } from "@/lib/errors";

export const metadata = { title: "PoolPass docs — Errors" };

const REMEDIATION: Record<number, string> = {
  1: "Only the pool issuer can update the accredited set or advance the epoch. Connect the issuer wallet.",
  2: "The proof did not verify against the committed key. Regenerate it; check you used the current root and the correct circuit artifacts.",
  3: "The issuer committed a new root after you fetched your path. Request a fresh accreditation and re-prove.",
  4: "The issuer advanced the epoch between proving and subscribing. Regenerate the nullifier (it depends on epoch) and re-prove.",
  5: "This secret already subscribed in the current epoch. Wait for the next epoch or use a different accreditation.",
  6: "The amount sent to subscribe must equal the amount in the proof and stay within the cap and 64-bit range.",
  7: "The Mock USDC transfer failed, usually for lack of balance. Use the faucet, then retry.",
  8: "The pool has not been initialized. This should not happen for the deployed demo pool.",
};

export default function Errors() {
  return (
    <Prose>
      <H1>Errors</H1>
      <Lead>
        Every contract error decodes to a human message in the UI — a raw <Mono>Error(Contract, #N)</Mono> never reaches
        a user. The full table, with likely cause and remediation:
      </Lead>
      <Table
        head={["Code", "Variant", "Message", "Cause & remediation"]}
        rows={Object.entries(ERROR_TABLE).map(([code, e]) => [
          <Mono key={code}>{code}</Mono>,
          <Mono key={`v${code}`}>{e.variant}</Mono>,
          e.message,
          REMEDIATION[Number(code)],
        ])}
      />
      <P>
        Decode either <Mono>ContractError(n)</Mono> or <Mono>Error(Contract, #n)</Mono>. Wallet-authorization failures
        surface as Soroban host authentication errors and map to a friendly &ldquo;signature declined&rdquo; or
        &ldquo;authorization failed&rdquo; message.
      </P>

      <H2 id="how-it-surfaces">How an error reaches you</H2>
      <P>
        The contract returns a numeric code. The frontend never shows that raw code. <Mono>lib/errors.ts</Mono> runs a
        single <Mono>decodeError</Mono> pass that:
      </P>
      <UL>
        <li>extracts the contract code from any of <Mono>Error(Contract, #n)</Mono>, <Mono>ContractError(n)</Mono>, or a bare <Mono>#n</Mono>;</li>
        <li>maps it to the variant name and the human message in the table above;</li>
        <li>falls through to wallet and network heuristics (declined signature, missing extension, insufficient balance, network timeout) when no contract code is present;</li>
        <li>returns a generic, safe message rather than leaking internals when nothing matches.</li>
      </UL>
      <P>The result renders as a toast with a title and a one-line description. A raw stack trace never reaches the UI.</P>

      <H2 id="recovery">The two most common recoveries</H2>
      <P>
        The two errors a normal user actually hits are round changes and double subscriptions. Both are expected, not
        bugs:
      </P>
      <UL>
        <li>
          <strong>Round moved (codes 3, 4).</strong> The issuer committed a new root or advanced the epoch between your
          proof and your submission. The nullifier and the root are part of the proof, so request a fresh accreditation
          and prove again. The UI narrates this in plain language rather than surfacing the code.
        </li>
        <li>
          <strong>Already subscribed (code 5).</strong> Your one-time tag for this round is spent. Wait for the next
          epoch. A same-nullifier replay is exactly what should fail, and it finalizes <Mono>FAILED</Mono> on chain (see
          the for-judges page for the live replay transaction).
        </li>
      </UL>

      <Callout title="Payment failures (code 7)">
        <p>
          A <Mono>PaymentFailed</Mono> almost always means the investor wallet lacks Mock USDC. Use the faucet, wait for
          the mint to settle, then resubmit. The proof itself does not need regenerating, since the amount and round did
          not change.
        </p>
      </Callout>
    </Prose>
  );
}
