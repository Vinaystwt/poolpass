import { proxyPost } from "@/lib/proxy";

export const dynamic = "force-dynamic";

// FALLBACK ONLY. This route forwards private circuit inputs to the backend /prove
// endpoint in plaintext. The default user route is in-browser proving; this exists
// for clients that cannot run snarkjs fast enough. The UI requires an explicit
// opt-in with a privacy warning before calling it (see FRONTEND_INTEGRATION.md).
export async function POST(req: Request) {
  const body = await req.json();
  return proxyPost("/prove", body);
}
