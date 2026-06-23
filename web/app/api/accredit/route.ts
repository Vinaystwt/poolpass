import { proxyPost } from "@/lib/proxy";

export const dynamic = "force-dynamic";

// Self-serve accreditation. The browser sends ONLY the 32-byte leaf hash;
// the backend (which holds the demo-issuer key) commits all 8 leaves on-chain
// and returns the Merkle path. Private inputs never reach this route.
export async function POST(req: Request) {
  const body = await req.json();
  return proxyPost("/accredit", body);
}
