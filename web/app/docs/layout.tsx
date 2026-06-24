"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DOCS_NAV } from "@/lib/docs-nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto max-w-container px-lg py-xl">
      <div className="grid gap-xl lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <p className="mb-md text-micro-cap uppercase tracking-wide text-ink-mute">Documentation</p>
          <nav className="flex flex-col gap-xxs">
            {DOCS_NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-md py-xs text-body-md transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-ink-mute hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <article className="min-w-0">
          <nav className="mb-lg text-caption text-ink-mute">
            <Link href="/docs" className="hover:text-primary">
              Docs
            </Link>
            {pathname !== "/docs" && (
              <>
                {" / "}
                <span className="text-ink">{DOCS_NAV.find((d) => d.href === pathname)?.label ?? ""}</span>
              </>
            )}
          </nav>
          {children}
        </article>
      </div>
    </div>
  );
}
