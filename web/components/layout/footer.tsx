import Link from "next/link";
import { Logo } from "./logo";
import { EXTERNAL_LINKS, CONTRACTS } from "@/lib/backend-config";
import { stellarExpertContract } from "@/lib/utils";

const COLS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Invest", href: "/invest" },
      { label: "Issuer console", href: "/issuer" },
      { label: "Generate a proof", href: "/prove" },
      { label: "Demo", href: "/demo" },
    ],
  },
  {
    title: "Docs",
    links: [
      { label: "How it works", href: "/docs/how-it-works" },
      { label: "Mathematics", href: "/docs/mathematics" },
      { label: "Host functions", href: "/docs/host-functions" },
      { label: "For judges", href: "/docs/for-judges" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Repository", href: EXTERNAL_LINKS.repo, external: true },
    ],
  },
  {
    title: "Verify",
    links: [
      { label: "PoolPass contract", href: stellarExpertContract(CONTRACTS.poolpass), external: true },
      { label: "Stellar", href: EXTERNAL_LINKS.stellar, external: true },
      { label: "snarkjs", href: EXTERNAL_LINKS.snarkjs, external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto grid max-w-container grid-cols-2 gap-xl px-lg py-huge md:grid-cols-5">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-md max-w-[220px] text-caption text-ink-mute">
            Prove you qualify. Reveal nothing. Built on Stellar testnet.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <h4 className="text-micro-cap uppercase tracking-wide text-ink-mute">{col.title}</h4>
            <ul className="mt-md flex flex-col gap-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-caption text-ink-secondary transition-colors hover:text-primary"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="text-caption text-ink-secondary transition-colors hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-container flex-col items-start justify-between gap-xs px-lg py-lg text-micro text-ink-mute md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} PoolPass · Deon Labs. A solo hackathon build on Stellar testnet.</span>
          <span>Mock USDC is a 7-decimal testnet token, not Circle USDC.</span>
        </div>
      </div>
    </footer>
  );
}
