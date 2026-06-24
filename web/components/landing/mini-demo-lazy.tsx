"use client";

import dynamic from "next/dynamic";

// Defer the snarkjs/circomlibjs-bearing proof console out of the landing's initial
// bundle. It loads as a separate chunk when the section mounts client-side.
const MiniDemo = dynamic(() => import("./mini-demo").then((m) => m.MiniDemo), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-hairline bg-card p-xl shadow-e2">
      <div className="h-5 w-48 animate-pulse rounded bg-ink/10" />
      <div className="mt-lg h-24 w-full animate-pulse rounded-lg bg-ink/5" />
      <div className="mt-lg h-10 w-full animate-pulse rounded-pill bg-ink/10" />
    </div>
  ),
});

export function MiniDemoLazy() {
  return <MiniDemo />;
}
