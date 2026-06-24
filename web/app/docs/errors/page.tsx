import { Prose, H1, Lead, P, Mono, Table } from "@/components/docs/prose";
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
    </Prose>
  );
}
