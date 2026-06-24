"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Upload,
  GitCommitVertical,
  FastForward,
  Coins,
  Download,
  Loader2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HashChip } from "@/components/shared/copy";
import { TreeViz } from "@/components/issuer/tree-viz";
import { WalletPill } from "@/components/wallet/wallet-pill";
import { MySubscriptions } from "@/components/invest/my-subscriptions";
import { useWallet } from "@/lib/stellar/wallet";
import { usePoolInfo, useIndexer } from "@/lib/hooks/use-pool";
import { updateAccreditedSet, advanceEpoch } from "@/lib/stellar/client";
import { buildTreeFromLeaves, leafFromRecord, pathFor, type MerkleTree } from "@/lib/zk/merkle";
import { fieldToHex } from "@/lib/zk/field";
import { faucet } from "@/lib/api";
import { decodeError } from "@/lib/errors";
import { ACCOUNTS, MOCK_USDC } from "@/lib/backend-config";
import { formatMockUsdc, truncate } from "@/lib/utils";
import { subscriptions } from "@/lib/indexer";
import type { ProofPackage } from "@/lib/zk/types";

interface Row {
  investorId?: string;
  cap?: string;
  investorSecret?: string;
  leaf: bigint;
}

const ZERO_LEAF = "0";

export default function IssuerPage() {
  const { address, init } = useWallet();
  const { data: pool, refetch: refetchPool } = usePoolInfo();
  const { data: indexer } = useIndexer();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [tree, setTree] = React.useState<MerkleTree | null>(null);
  const [committing, setCommitting] = React.useState(false);
  const [advancing, setAdvancing] = React.useState(false);
  const [committedEpoch, setCommittedEpoch] = React.useState<number | null>(null);
  const [confirmEpoch, setConfirmEpoch] = React.useState(false);
  const [faucetAddr, setFaucetAddr] = React.useState("");

  React.useEffect(() => {
    void init();
  }, [init]);

  const isIssuer = address && address === ACCOUNTS.demoIssuer;

  const parseCsv = async (text: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const header = lines[0].toLowerCase();
    const hasHeader = /investor_id|leaf|cap|secret/.test(header);
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const leafOnly = /leaf/.test(header) && !/investor_id/.test(header);

    const parsed: Row[] = [];
    for (const line of dataLines.slice(0, 8)) {
      const cols = line.split(",").map((c) => c.trim());
      if (leafOnly || (cols.length === 1 && /^[0-9a-fx]+$/i.test(cols[0]))) {
        const hex = cols[0].replace(/^0x/, "");
        parsed.push({ leaf: BigInt(`0x${hex}`) });
      } else {
        const [investorId, cap, investorSecret] = cols;
        const leaf = await leafFromRecord({ investorId, cap, investorSecret: investorSecret ?? "0" });
        parsed.push({ investorId, cap, investorSecret, leaf });
      }
    }
    // pad to 8 leaves with zero leaves
    const leaves = parsed.map((r) => r.leaf.toString());
    while (leaves.length < 8) leaves.push(ZERO_LEAF);
    const built = await buildTreeFromLeaves(leaves);
    setRows(parsed);
    setTree(built);
    setCommittedEpoch(null);
    toast.success(`Parsed ${parsed.length} investor${parsed.length === 1 ? "" : "s"}`);
  };

  const onCommit = async () => {
    if (!tree || !address) return;
    setCommitting(true);
    try {
      const leafHashesHex = tree.leaves.map((l) => fieldToHex(l));
      const res = await updateAccreditedSet({ issuer: address, leafHashesHex, sign: useWallet.getState().signXdr });
      toast.success("Root committed", { description: truncate(res.hash, 8, 6) });
      const refreshed = await refetchPool();
      setCommittedEpoch(refreshed.data?.epoch ?? null);
    } catch (e) {
      const f = decodeError(e);
      toast.error(f.title, { description: f.message });
    } finally {
      setCommitting(false);
    }
  };

  const onAdvance = async () => {
    if (!address) return;
    setConfirmEpoch(false);
    setAdvancing(true);
    try {
      const res = await advanceEpoch({ issuer: address, sign: useWallet.getState().signXdr });
      toast.success("Epoch advanced", { description: truncate(res.hash, 8, 6) });
      void refetchPool();
    } catch (e) {
      const f = decodeError(e);
      toast.error(f.title, { description: f.message });
    } finally {
      setAdvancing(false);
    }
  };

  const downloadPackage = (row: Row, index: number) => {
    if (!tree) return;
    const path = pathFor(tree, index);
    const pkg: ProofPackage = {
      investor_id: row.investorId ?? "0",
      cap: row.cap ?? "0",
      investor_secret: row.investorSecret ?? "0",
      leaf: row.leaf.toString(),
      root: tree.root.toString(),
      index,
      merkle_path: path.siblings.map(String) as [string, string, string],
      merkle_indices: path.indices as [number, number, number],
      epoch: committedEpoch ?? pool?.epoch ?? 1,
      label: `Issuer package · investor ${row.investorId ?? index}`,
    };
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proof-package-${row.investorId ?? index}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSubscriptionsCsv = () => {
    if (!indexer) return;
    const subs = subscriptions(indexer);
    const header = "nullifier,commitment,amount,timestamp,txHash";
    const body = subs.map((s) => [s.nullifier, s.commitment, s.amount, s.timestamp, s.txHash].join(",")).join("\n");
    const blob = new Blob([`${header}\n${body}\n`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "poolpass-subscriptions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-container px-lg py-xxl">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="soft">Issuer console</Badge>
          <h1 className="mt-md text-display-lg text-ink">Manage the demo pool.</h1>
        </div>
        <WalletPill />
      </div>

      {/* Pool overview (always visible) */}
      <Card className="mt-xl p-xl">
        <h2 className="text-heading-md text-ink">{pool?.pool_name ?? "Loading pool…"}</h2>
        <dl className="mt-md grid grid-cols-2 gap-lg md:grid-cols-4">
          <Stat label="Epoch" value={pool ? String(pool.epoch) : "·"} />
          <Stat label="Total subscribed" value={pool ? `${formatMockUsdc(pool.total_subscribed)} ${MOCK_USDC.ticker}` : "·"} />
          <Stat label="Merkle depth" value={pool ? `${pool.merkle_depth} · 8 leaves` : "·"} />
          <Stat label="Per-investor cap" value={pool ? (pool.per_investor_cap_public ? formatMockUsdc(pool.per_investor_cap_public) : "none") : "·"} />
        </dl>
        {pool && (
          <div className="mt-md">
            <p className="text-caption text-ink-mute">Current root</p>
            <HashChip value={pool.merkle_root} />
          </div>
        )}
      </Card>

      {!isIssuer ? (
        <>
          <Card className="mt-lg p-xl">
            <Lock className="h-5 w-5 text-ink-mute" />
            <h2 className="mt-md text-heading-md text-ink">What an issuer does here</h2>
            <p className="mt-xs max-w-[64ch] text-body-md text-ink-secondary">
              This console is the issuer side of PoolPass. You are viewing the live demo pool in read-only mode. Connect
              the demo issuer wallet to run the full set of actions below. The pool state above is real and on chain.
            </p>
            <div className="mt-lg grid gap-md md:grid-cols-2">
              {[
                {
                  title: "Accredit investors",
                  body: "Upload a CSV of approved investors. The Merkle tree is built in the browser; only leaf hashes are committed on chain. The raw list never leaves this device.",
                },
                {
                  title: "Commit the root",
                  body: "Publish the tree root with update_accredited_set. Every investor proves membership against this single value, and the on-chain state stays one hash.",
                },
                {
                  title: "Monitor subscriptions",
                  body: "Watch subscriptions stream in from the indexer: amount, commitment, nullifier, and time. Click any row to open the public verification page.",
                },
                {
                  title: "Advance epochs",
                  body: "Open a new round. Nullifiers are scoped to an epoch, so a new round resets eligibility without exposing or linking past subscribers.",
                },
              ].map((c) => (
                <div key={c.title} className="rounded-lg border border-hairline bg-canvas-soft p-lg">
                  <h3 className="text-heading-sm text-ink">{c.title}</h3>
                  <p className="mt-xs text-body-md text-ink-secondary">{c.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-lg max-w-[64ch] text-caption text-ink-mute">
              Launching your own pool from the frontend is on the roadmap. The contract supports a pool factory; the
              deploy flow is out of scope for this build.
            </p>
            <Button asChild variant="ghost" size="sm" className="mt-sm">
              <a href="/roadmap">
                See the roadmap <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </Card>

          <Card className="mt-lg p-xl">
            <h2 className="text-heading-md text-ink">Subscription monitor</h2>
            <p className="mt-xs text-body-md text-ink-mute">
              Live from the indexer, visible to anyone. This is the same stream the issuer watches.
            </p>
            <div className="mt-md">
              <MySubscriptions />
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Accreditation management */}
          <Card className="mt-lg p-xl">
            <div className="flex items-center gap-sm">
              <Upload className="h-4 w-4 text-primary" />
              <h2 className="text-heading-md text-ink">Accredited investor set</h2>
            </div>
            <p className="mt-xs text-body-md text-ink-mute">
              Upload a CSV of <span className="mono text-[12px]">investor_id,cap,investor_secret_placeholder</span> or a
              single <span className="mono text-[12px]">leaf_hash</span> column. The tree is built in your browser; only
              leaf hashes are committed on chain.
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              className="mt-md block text-caption text-ink-mute file:mr-sm file:rounded-pill file:border-0 file:bg-primary file:px-md file:py-xs file:text-on-primary"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await parseCsv(await file.text());
              }}
            />

            {tree && (
              <div className="mt-lg flex flex-col gap-lg">
                <TreeViz levels={tree.levels.map((lvl) => lvl.map((n) => fieldToHex(n)))} />
                <div className="overflow-x-auto rounded-lg border border-hairline">
                  <table className="w-full min-w-[560px] text-left">
                    <thead>
                      <tr className="border-b border-hairline text-micro-cap uppercase tracking-wide text-ink-mute">
                        <th className="px-md py-sm font-normal">#</th>
                        <th className="px-md py-sm font-normal">investor_id</th>
                        <th className="px-md py-sm font-normal">cap</th>
                        <th className="px-md py-sm font-normal">leaf</th>
                        <th className="px-md py-sm font-normal" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} className="border-b border-hairline/60 last:border-0">
                          <td className="px-md py-sm tnum text-body-md text-ink-mute">{i}</td>
                          <td className="px-md py-sm mono text-[12px] text-ink">{r.investorId ?? "·"}</td>
                          <td className="px-md py-sm tnum text-body-md text-ink">
                            {r.cap ? formatMockUsdc(r.cap) : "·"}
                          </td>
                          <td className="px-md py-sm"><HashChip value={fieldToHex(r.leaf)} copy={false} /></td>
                          <td className="px-md py-sm">
                            <Button variant="ghost" size="sm" onClick={() => downloadPackage(r, i)}>
                              <Download className="h-3.5 w-3.5" /> Package
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-md">
                  <Button onClick={onCommit} disabled={committing}>
                    {committing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCommitVertical className="h-4 w-4" />}
                    {committing ? "Committing…" : "Commit to chain"}
                  </Button>
                  <span className="text-caption text-ink-mute">
                    New root: <HashChip value={fieldToHex(tree.root)} copy={false} />
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Controls */}
          <div className="mt-lg grid gap-lg md:grid-cols-2">
            <Card className="p-xl">
              <div className="flex items-center gap-sm">
                <FastForward className="h-4 w-4 text-primary" />
                <h2 className="text-heading-md text-ink">Epoch control</h2>
              </div>
              <p className="mt-xs text-body-md text-ink-mute">
                Nullifiers are epoch-scoped in the proof, so advancing the epoch opens a new round without resetting any
                on-chain map. Existing nullifiers stay recorded.
              </p>
              {confirmEpoch ? (
                <div className="mt-md flex gap-sm">
                  <Button variant="outline" size="sm" onClick={() => setConfirmEpoch(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={onAdvance} disabled={advancing}>
                    {advancing ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Confirm advance
                  </Button>
                </div>
              ) : (
                <Button className="mt-md" variant="secondary" onClick={() => setConfirmEpoch(true)}>
                  Advance epoch
                </Button>
              )}
            </Card>

            <Card className="p-xl">
              <div className="flex items-center gap-sm">
                <Coins className="h-4 w-4 text-primary" />
                <h2 className="text-heading-md text-ink">Faucet</h2>
              </div>
              <p className="mt-xs text-body-md text-ink-mute">Send Mock USDC to any address, useful mid-demo.</p>
              <div className="mt-md flex gap-sm">
                <Input placeholder="G..." value={faucetAddr} onChange={(e) => setFaucetAddr(e.target.value)} />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!faucetAddr.trim()}
                  onClick={async () => {
                    try {
                      await faucet(faucetAddr.trim());
                      toast.success("Faucet sent");
                    } catch (e) {
                      toast.error(decodeError(e).title, { description: decodeError(e).message });
                    }
                  }}
                >
                  Send
                </Button>
              </div>
            </Card>
          </div>

          {/* Subscription monitor */}
          <div className="mt-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-display-md text-ink">Subscription monitor</h2>
              <Button variant="ghost" size="sm" onClick={exportSubscriptionsCsv}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
            <div className="mt-md">
              <MySubscriptions />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-ink-mute">{label}</dt>
      <dd className="tnum text-heading-sm text-ink">{value}</dd>
    </div>
  );
}
