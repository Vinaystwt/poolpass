"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCS_NAV } from "@/lib/docs-nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = DOCS_NAV.find((d) => d.href === pathname);

  const navLinks = (onClick?: () => void) =>
    DOCS_NAV.map((item) => {
      const active = pathname === item.href;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClick}
          className={cn(
            "rounded-md px-md py-xs text-body-md transition-colors",
            active ? "bg-ink/[0.06] text-ink" : "text-ink-mute hover:bg-ink/5 hover:text-ink",
          )}
        >
          {item.label}
        </Link>
      );
    });

  return (
    <div className="mx-auto max-w-container px-lg py-xl">
      <div className="grid gap-xl lg:grid-cols-[220px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:sticky lg:top-20 lg:block lg:h-fit">
          <p className="mb-md text-micro-cap uppercase tracking-wide text-ink-mute">Documentation</p>
          <nav className="flex flex-col gap-xxs">{navLinks()}</nav>
        </aside>

        <article className="min-w-0">
          {/* Mobile accordion */}
          <details className="mb-lg rounded-lg border border-hairline lg:hidden">
            <summary className="flex cursor-pointer items-center gap-sm px-md py-sm text-body-md text-ink">
              <Menu className="h-4 w-4 text-ink-mute" />
              {current?.label ?? "Documentation"}
            </summary>
            <nav className="flex flex-col gap-xxs border-t border-hairline p-xs">{navLinks()}</nav>
          </details>

          <nav className="mb-lg hidden text-caption text-ink-mute lg:block">
            <Link href="/docs" className="hover:text-ink">
              Docs
            </Link>
            {pathname !== "/docs" && (
              <>
                {" / "}
                <span className="text-ink">{current?.label ?? ""}</span>
              </>
            )}
          </nav>
          {children}
        </article>
      </div>
    </div>
  );
}
