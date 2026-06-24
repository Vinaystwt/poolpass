import { Prose, H1, Lead, H2, H3, P, Mono, CodeBlock, Callout, Table } from "@/components/docs/prose";
import { Toc } from "@/components/docs/toc";

export const metadata = { title: "PoolPass docs: Mathematics" };

export default function Mathematics() {
  return (
    <Prose>
      <H1>Mathematics</H1>
      <Lead>
        Every value below is a canonical element of the BN254 scalar field Fr. The circuit proves four statements at
        once and reveals four public inputs: <Mono>[merkle_root, amount, nullifier, epoch]</Mono>.
      </Lead>

      <Toc />

      <H2 id="field">The field</H2>
      <P>The scalar field modulus, where all witness and public values live:</P>
      <CodeBlock lang="BN254 Fr modulus">
        {`r = 21888242871839275222246405745257275088548364400416034343698204186575808495617`}
      </CodeBlock>

      <H2 id="statement">The statement</H2>
      <H3 id="leaf">1 · Leaf commitment</H3>
      <P>An accredited investor is a leaf in the issuer&rsquo;s tree. The leaf binds identity, cap, and a secret:</P>
      <CodeBlock>{`leaf = Poseidon3(investor_id, cap, investor_secret)`}</CodeBlock>

      <H3 id="merkle">2 · Merkle membership</H3>
      <P>
        The leaf hashes up a depth-3 path to the committed root. At each level, the path bit{" "}
        <Mono>b_i ∈ {`{0,1}`}</Mono> orders the pair before hashing:
      </P>
      <CodeBlock>{`h_0 = leaf
h_{i+1} = b_i = 0 ? Poseidon2(h_i, sibling_i) : Poseidon2(sibling_i, h_i)
merkle_root = h_3            // public input`}</CodeBlock>

      <H3 id="range">3 · Range relation</H3>
      <P>
        The public amount must not exceed the private cap, and is constrained to 64 bits (7-decimal base units):
      </P>
      <CodeBlock>{`amount <= cap          and          0 <= amount < 2^64`}</CodeBlock>

      <H3 id="nullifier">4 · Nullifier and commitment</H3>
      <P>
        The nullifier binds one subscription per <Mono>(secret, epoch)</Mono>; the commitment records the subscription
        without re-revealing the secret:
      </P>
      <CodeBlock>{`nullifier  = Poseidon2(investor_secret, epoch)        // public input
commitment = Poseidon3(nullifier, amount, epoch)     // returned by subscribe`}</CodeBlock>

      <H2 id="poseidon">Poseidon parameters</H2>
      <P>Classic circomlib Poseidon over BN254 Fr. Two width variants, computed by hand:</P>
      <Table
        head={["Arity", "Width t", "Full rounds R_F", "Partial rounds R_P", "Used for"]}
        rows={[
          ["2-input", <Mono key="t3">t = 3</Mono>, "8", "57", "Merkle nodes, nullifier"],
          ["3-input", <Mono key="t4">t = 4</Mono>, "8", "56", "leaf, commitment"],
        ]}
      />

      <H2 id="groth16">Groth16 verification</H2>
      <P>
        With proof <Mono>(A, B, C)</Mono>, verifying key <Mono>(α, β, γ, δ, IC)</Mono>, and public inputs{" "}
        <Mono>x_1..x_4</Mono>, the verifier checks one pairing-product equation:
      </P>
      <CodeBlock>{`e(A, B) = e(α, β) · e(L, γ) · e(C, δ)

where  L = IC_0 + Σ_{i=1..4} x_i · IC_i`}</CodeBlock>
      <P>
        On chain this is a single native BN254 pairing host call (CAP-0074). The proof is 256 bytes; the verifying key
        carries <Mono>IC</Mono> of length 5 (one base point plus one per public signal).
      </P>

      <H2 id="worked">A worked 8-leaf example</H2>
      <P>
        These are the real numbers from <Mono>circuits/fixtures/tree.json</Mono>. The eight leaves:
      </P>
      <CodeBlock lang="leaves (Fr)">{`L0 16557954371118903523369896665038481834779587051122472902175676474941900806891
L1 8028477191701634491022509627331333641619373339326806357258960432799413535311
L2 12893205181829035144918275392963016566095938447231477489571980199106169905498
L3 11394988421783667103737052804725122195604032778315219341263051844605992717555
L4 2389403069834309648177430293075600320606710489829300862078302471874876606594
L5 1019621368353778133539355515541377547876040156061198940754797567368030708243
L6 17378101785522100086158976512526383480064960805668474857498890613059552560570
L7 14659279386437270083870174181804470449226118232359344769161099059579350216344`}</CodeBlock>

      <P>
        Take leaf index <Mono>2</Mono> (path indices <Mono>[0, 1, 0]</Mono>). The path hashes to the root in three
        Poseidon2 steps:
      </P>
      <CodeBlock lang="membership trace, leaf index 2">{`h0 = L2 = 12893205181829035144918275392963016566095938447231477489571980199106169905498

# level 0, b=0, sibling = L3
h1 = Poseidon2(L2, L3)
   = 12890551834249873553577838208612920974524018745806333979994876329805909211689

# level 1, b=1, sibling = node[1,0]
h2 = Poseidon2(15433287407569847909368511689487787902083850118714026812950920625613019578967, h1)
   = 2494936514636011527722204016798649733204020281115724428000404920469392127035

# level 2, b=0, sibling = node[2,1]
root = Poseidon2(h2, 4876111224302462558615753393385604022409636210284542432896015278460659644565)
     = 16728084433781642160513578623962861653988778837989211022411042828625333450201`}</CodeBlock>
      <Callout title="The root">
        <p>
          <Mono>16728084433781642160513578623962861653988778837989211022411042828625333450201</Mono> is exactly the{" "}
          <Mono>merkle_root</Mono> public input the demo proof on this site produces. You can confirm it on the{" "}
          <a className="text-primary hover:underline" href="/prove">
            Prove page
          </a>
          .
        </p>
      </Callout>

      <H2 id="constraints">Constraint budget</H2>
      <P>
        The circuit is dominated by Poseidon permutations. Approximate R1CS constraint contributions per gadget:
      </P>
      <Table
        head={["Gadget", "Count", "≈ constraints"]}
        rows={[
          ["Poseidon3 (leaf)", "1", "~245"],
          ["Poseidon2 (Merkle path)", "3", "~660"],
          ["Poseidon2 (nullifier)", "1", "~220"],
          ["Poseidon3 (commitment)", "1", "~245"],
          ["Range / bit decomposition (amount ≤ cap, 64-bit)", "1", "~80"],
          [<strong key="t">Total</strong>, "", <strong key="tt">~1,350</strong>],
        ]}
      />

      <H2 id="performance">Performance</H2>
      <Table
        head={["Stage", "Where", "Observed"]}
        rows={[
          ["Witness", "browser Web Worker", "~120–210 ms"],
          ["Prove (Groth16)", "browser Web Worker", "~600–880 ms"],
          ["Verify (local)", "browser Web Worker", "~40 ms"],
          ["End-to-end", "browser, warm", "~0.8–1.1 s"],
          ["Verify (on chain)", "native BN254 host call", "single priced host call"],
        ]}
      />
      <P>
        The 256-byte proof and four 32-byte public inputs are the only data that leave the investor&rsquo;s machine.
      </P>
    </Prose>
  );
}
