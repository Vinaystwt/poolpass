import type { ProofPackage } from "./types";

// Baked test input — mirrors circuits/example_input.json + circuits/fixtures/proof-package.json.
// This is a circuit test fixture (not a deployment value), used by the landing mini-demo and
// as the default package on /prove so a visitor can feel a real proof with no wallet.
export const DEMO_PROOF_PACKAGE: ProofPackage = {
  investor_id: "3",
  cap: "30000000000",
  investor_secret: "1003",
  leaf: "12893205181829035144918275392963016566095938447231477489571980199106169905498",
  root: "16728084433781642160513578623962861653988778837989211022411042828625333450201",
  index: 2,
  merkle_path: [
    "11394988421783667103737052804725122195604032778315219341263051844605992717555",
    "15433287407569847909368511689487787902083850118714026812950920625613019578967",
    "4876111224302462558615753393385604022409636210284542432896015278460659644565",
  ],
  merkle_indices: [0, 1, 0],
  epoch: 1,
  amount: "25000000000",
  label: "Demo proof · baked 8-leaf test tree",
};
