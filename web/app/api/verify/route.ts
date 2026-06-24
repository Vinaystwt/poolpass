import { proxyPost } from "@/lib/proxy";

export const dynamic = "force-dynamic";

// Proxies the backend /verify endpoint (FRONTEND_INTEGRATION.md). The backend
// always uses the committed PoolPass VK and ignores caller key substitution.
// Proof + publicSignals are public, so this leaks nothing. The DEFAULT verify
// path is in-browser (snarkjs in the worker); this server route is the secondary
// "Verify via backend" button.
export async function POST(req: Request) {
  const body = await req.json();
  return proxyPost("/verify", body);
}
