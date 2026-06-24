import { NextResponse } from "next/server";
import { rpc, xdr, Address, scValToNative } from "@stellar/stellar-sdk";
import { NETWORK } from "@/lib/backend-config";

export const dynamic = "force-dynamic";

// Reconstructs the proof + public inputs from a subscribe transaction's invocation
// args, so anyone can verify any on-chain subscription with no prior session state.
// subscribe(investor, amount, proof: Bytes, public_inputs: Vec<BytesN<32>>)
export async function GET(_req: Request, { params }: { params: { hash: string } }) {
  const hash = params.hash;
  try {
    const server = new rpc.Server(NETWORK.rpcUrl);
    const res = await server.getTransaction(hash);
    if (res.status !== rpc.Api.GetTransactionStatus.SUCCESS || !res.envelopeXdr) {
      return NextResponse.json({ error: "not_found", message: "Transaction not found or not successful." }, { status: 404 });
    }

    const env = res.envelopeXdr as xdr.TransactionEnvelope;
    // Unwrap fee-bump envelopes.
    let tx: xdr.Transaction;
    if (env.switch().name === "envelopeTypeTxFeeBump") {
      tx = env.feeBump().tx().innerTx().v1().tx();
    } else {
      tx = env.v1().tx();
    }

    const ops = tx.operations();
    const op = ops.find((o) => o.body().switch().name === "invokeHostFunction");
    if (!op) return NextResponse.json({ error: "no_invoke" }, { status: 422 });

    const invoke = op.body().invokeHostFunctionOp().hostFunction().invokeContract();
    const args = invoke.args();
    // [0] investor address, [1] amount i128, [2] proof bytes, [3] public inputs vec
    const investor = Address.fromScVal(args[0]).toString();
    const amount = scValToNative(args[1]) as bigint;
    const proofBytes = args[2].bytes();
    const proofHex = Buffer.from(proofBytes).toString("hex");
    const piVec = args[3].vec() ?? [];
    const publicSignalsHex = piVec.map((v) => Buffer.from(v.bytes()).toString("hex"));
    const publicSignals = publicSignalsHex.map((h) => BigInt(`0x${h}`).toString());

    return NextResponse.json({
      hash,
      investor,
      amount: amount.toString(),
      proofHex,
      publicSignalsHex,
      publicSignals,
    });
  } catch (err) {
    return NextResponse.json({ error: "decode_failed", message: String(err) }, { status: 500 });
  }
}
