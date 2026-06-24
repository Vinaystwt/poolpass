// Plain-language definitions for every ZK term shown in the core flow.
// One sentence each, non-circular, written for a smart non-expert.
// The <Term> component reads from here so definitions stay consistent everywhere.

export const GLOSSARY: Record<string, string> = {
  nullifier:
    "A one-time tag that stops the same person subscribing twice in a round, without revealing who they are.",
  commitment:
    "A sealed receipt of a subscription recorded on chain that proves it happened without exposing the private details behind it.",
  "merkle path":
    "The short list of sibling hashes that links your entry to the published root, proving you are on the list without showing the list.",
  "merkle tree":
    "A way to fold a whole list of members into one short fingerprint (the root), so membership can be checked against that one value.",
  leaf:
    "Your single entry in the issuer's list, stored as a hash so the raw details stay private.",
  "public inputs":
    "The four values the proof reveals on purpose: the list root, the amount, the one-time tag, and the round number.",
  proof:
    "A small piece of math (256 bytes) that convinces anyone a statement is true while revealing nothing else.",
  constraint:
    "One arithmetic rule the circuit enforces. This circuit has about 1,350 of them, which is small and fast.",
  epoch:
    "A subscription round. The issuer can open a new round, and tags from old rounds cannot be reused or linked across rounds.",
  poseidon:
    "A hash function built for zero-knowledge proofs, used here to turn private details into the list entries and tags.",
  groth16:
    "The proof system PoolPass uses. It produces a tiny, fixed-size proof that a contract can check in one step.",
  accreditation:
    "The issuer confirming you qualify, by adding your entry to its private list and publishing only the list's fingerprint.",
};

/** Look up a definition by the term text (case-insensitive). */
export function defineTerm(term: string): string | undefined {
  return GLOSSARY[term.trim().toLowerCase()];
}
