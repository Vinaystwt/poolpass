import { EXTERNAL_LINKS } from "@/lib/backend-config";

const ITEMS: { label: string; sub: string; href: string }[] = [
  { label: "Stellar", sub: "Soroban · Protocol 26 Yardstick", href: EXTERNAL_LINKS.soroban },
  { label: "Circom", sub: "Circuit language", href: EXTERNAL_LINKS.circom },
  { label: "snarkjs", sub: "Groth16 prover", href: EXTERNAL_LINKS.snarkjs },
  { label: "circomlib", sub: "Poseidon gadgets", href: EXTERNAL_LINKS.circomlib },
  { label: "Bachini", sub: "Noir-on-Stellar tutorial", href: EXTERNAL_LINKS.bachiniTutorial },
];

export function TrustStrip() {
  return (
    <div className="mt-lg grid grid-cols-2 gap-md sm:grid-cols-3 md:grid-cols-5">
      {ITEMS.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-hairline bg-card p-md transition-colors hover:border-primary"
        >
          <p className="text-heading-sm text-ink">{it.label}</p>
          <p className="text-micro text-ink-mute">{it.sub}</p>
        </a>
      ))}
    </div>
  );
}
