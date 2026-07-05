import { afterEach, describe, expect, test, vi } from "vitest";

import { proxyGet, proxyPost } from "./proxy.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("backend proxy errors", () => {
  test("returns a public-safe message when the backend is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:3000");
    }));

    const response = await proxyPost("/faucet", { address: "test" });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: "backend_unreachable",
      message: "The PoolPass API is temporarily unavailable.",
    });
  });

  test("does not cache live backend reads", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ pools: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await proxyGet("/pools");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://poolpass-vh80.onrender.com/pools",
      { cache: "no-store" },
    );
  });
});
