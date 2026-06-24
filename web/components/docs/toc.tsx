"use client";

import * as React from "react";

interface Item {
  id: string;
  label: string;
  level: number;
}

/** On-this-page jump list. Scans the article for h2/h3 with ids after mount. */
export function Toc() {
  const [items, setItems] = React.useState<Item[]>([]);

  React.useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("article h2[id], article h3[id]");
    setItems(
      Array.from(nodes).map((n) => ({
        id: n.id,
        label: n.textContent ?? "",
        level: n.tagName === "H3" ? 3 : 2,
      })),
    );
  }, []);

  if (items.length < 3) return null;

  return (
    <nav className="rounded-lg border border-hairline bg-canvas-soft p-lg">
      <p className="mb-sm text-micro-cap uppercase tracking-wide text-ink-mute">On this page</p>
      <ul className="flex flex-col gap-xxs">
        {items.map((it) => (
          <li key={it.id} className={it.level === 3 ? "ml-md" : ""}>
            <a href={`#${it.id}`} className="text-body-md text-ink-mute transition-colors hover:text-ink">
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
