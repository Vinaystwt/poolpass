import { NextResponse } from "next/server";
import * as snarkjs from "snarkjs";
import vk from "@/public/zk/verification_key.json";

export const dynamic = "force-dynamic";

// Server-side verification against the committed PoolPass VK. This matches the
// backend /verify guarantee ("always uses the committed VK, ignores caller key
// substitution") and keeps the "Verify via backend" button working without the
// long-running service. Proof + publicSignals are public, so this leaks nothing.
export async function POST(req: Request) {
  try {
    const { proof, publicSignals } = await req.json();
    if (!proof || !Array.isArray(publicSignals)) {
      return NextResponse.json({ valid: false, error: "Malformed request" }, { status: 400 });
    }
    const valid: boolean = await snarkjs.groth16.verify(vk, publicSignals, proof);
    return NextResponse.json({ valid });
  } catch (err) {
    return NextResponse.json({ valid: false, error: String(err) }, { status: 200 });
  }
}
