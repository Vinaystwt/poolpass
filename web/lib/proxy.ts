import { NextResponse } from "next/server";
import { API_BASE } from "./backend-config";

/** Forwards a JSON POST to the PoolPass backend service, same-origin from the browser. */
export async function proxyPost(path: string, body: unknown) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      {
        error: "backend_unreachable",
        message: `The PoolPass API at ${API_BASE} is not reachable. Start it with \`pnpm api\`.`,
        detail: String(err),
      },
      { status: 502 },
    );
  }
}

export async function proxyGet(path: string) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "backend_unreachable", message: `The PoolPass API at ${API_BASE} is not reachable.`, detail: String(err) },
      { status: 502 },
    );
  }
}
