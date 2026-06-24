import { Prose, H1, Lead, H2, P, Mono, CodeBlock, Table } from "@/components/docs/prose";
import { CONTRACTS } from "@/lib/backend-config";
import { HashChip } from "@/components/shared/copy";
import { ArchitectureDiagram } from "@/components/diagrams/architecture-diagram";
import { Toc } from "@/components/docs/toc";

export const metadata = { title: "PoolPass docs: Architecture" };

export default function Architecture() {
  return (
    <Prose>
      <H1>Architecture</H1>
      <Lead>
        A Soroban contract on testnet, a snarkjs circuit, three Node services, and this Next.js frontend. The private
        path runs entirely in the browser; the services hold only issuer-side state.
      </Lead>

      <ArchitectureDiagram />

      <Toc />

      <H2 id="contracts">Contracts</H2>
      <Table
        head={["Role", "Contract ID"]}
        rows={[
          ["PoolPass", <HashChip key="p" value={CONTRACTS.poolpass} />],
          ["Mock USDC (SAC)", <HashChip key="u" value={CONTRACTS.mockUsdc} />],
          ["Pool token", <HashChip key="pt" value={CONTRACTS.poolToken} />],
          ["Poseidon parity gate", <HashChip key="gp" value={CONTRACTS.gatePoseidon} />],
          ["Groth16 parity gate", <HashChip key="gg" value={CONTRACTS.gateGroth16} />],
        ]}
      />

      <H2 id="methods">PoolPass methods</H2>
      <CodeBlock lang="contract interface">{`initialize(issuer, usdc_sac, pool_token, groth16_vk: Bytes, merkle_depth: u32, pool_name: String) -> Result<(), Error>
update_accredited_set(issuer, leaf_hashes: Vec<BytesN<32>>) -> Result<BytesN<32>, Error>
subscribe(investor, amount: i128, proof: Bytes, public_inputs: Vec<BytesN<32>>) -> Result<BytesN<32>, Error>
get_pool_info() -> Result<PoolInfo, Error>
advance_epoch(issuer) -> Result<u32, Error>`}</CodeBlock>
      <P>
        The issuer must authorize set updates and epoch advances. The investor must authorize <Mono>subscribe</Mono> and
        its nested Mock USDC transfer.
      </P>

      <H2 id="events">Events</H2>
      <P>
        PoolPass uses the SDK 26 <Mono>#[contractevent]</Mono> API. The generated <Mono>publish</Mono> prepends the
        snake-case event-name symbol to the topic vector; non-topic fields are a canonical <Mono>ScMap</Mono>, named
        rather than positional. Reproduced verbatim from the integration contract:
      </P>
      <CodeBlock lang="event shapes">{`RootUpdated { root, leaf_count, epoch(topic), timestamp }
  topics: Symbol("root_updated"), epoch: u32
  data:   { leaf_count: u32, root: BytesN<32>, timestamp: u64 }   // key order: leaf_count, root, timestamp

Subscribed { investor(topic), amount, nullifier, commitment, epoch(topic), timestamp }
  topics: Symbol("subscribed"), investor: Address, epoch: u32
  data:   { amount: i128, commitment: BytesN<32>, nullifier: BytesN<32>, timestamp: u64 }  // key order: amount, commitment, nullifier, timestamp

EpochAdvanced { epoch(topic), timestamp }
  topics: Symbol("epoch_advanced"), epoch: u32
  data:   { timestamp: u64 }`}</CodeBlock>
      <P>
        For RPC <Mono>getEvents</Mono>, filter by <Mono>type: &quot;contract&quot;</Mono>, the PoolPass contract ID, and
        the encoded first topic via <Mono>nativeToScVal(name, {`{ type: "symbol" }`}).toXDR(&quot;base64&quot;)</Mono>.
      </P>

      <H2 id="services">Services</H2>
      <Table
        head={["Service", "Role"]}
        rows={[
          [<Mono key="a">api</Mono>, "Fastify HTTP: /accredit, /faucet, /verify, /prove (fallback), /pool/demo."],
          [<Mono key="i">indexer</Mono>, "Reads RPC getEvents, dedupes by event ID, persists to services/data/events.json."],
          [<Mono key="d">demo-issuer</Mono>, "Holds the issuer key; commits leaves and mints Mock USDC."],
        ]}
      />

      <H2 id="repo">Repository</H2>
      <CodeBlock lang="layout">{`contracts/        Soroban contracts (poolpass, mock token, gates)
circuits/         Circom circuit, artifacts, fixtures, VK
src/              shared crypto: poseidon, field, merkle, groth16 serializer
services/         api, indexer, demo-issuer
merkle-tools/     standalone tree + proof helpers
web/              this Next.js frontend
deployments.json  machine-readable source of truth`}</CodeBlock>
    </Prose>
  );
}
