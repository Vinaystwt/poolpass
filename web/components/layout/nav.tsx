"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { WalletPill } from "@/components/wallet/wallet-pill";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/invest", label: "Invest" },
  { href: "/issuer", label: "Issuer" },
  { href: "/prove", label: "Prove" },
  { href: "/docs", label: "Docs" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/about", label: "About" },
];

const APP_ROUTES = ["/invest", "/issuer", "/prove", "/verify"];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const inApp = APP_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <header className="sticky top-0 z-30 border-b border-hairline/70 bg-canvas/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-container items-center justify-between px-lg">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden items-center gap-xl md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-body-md transition-colors hover:text-ink",
                pathname.startsWith(l.href) ? "text-ink" : "text-ink-mute",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-sm md:flex">
          <ThemeToggle />
          {inApp ? (
            <WalletPill />
          ) : (
            <Button asChild size="sm">
              <Link href="/invest">Launch app</Link>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-sm md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-pill text-ink hover:bg-ink/5"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-hairline bg-canvas px-lg py-md md:hidden">
          <div className="flex flex-col gap-xs">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-md py-sm text-body-lg text-ink hover:bg-ink/5"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-sm flex items-center justify-between px-md">
              <WalletPill />
              <Button asChild size="sm">
                <Link href="/invest" onClick={() => setOpen(false)}>
                  Launch app
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
