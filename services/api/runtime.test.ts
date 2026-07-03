import { describe, expect, test } from "vitest";

import {
  resolveListenOptions,
  resolveNetworkConfiguration,
} from "./runtime.js";

describe("hosted runtime configuration", () => {
  test("binds to all interfaces by default", () => {
    expect(resolveListenOptions({})).toEqual({
      host: "0.0.0.0",
      port: 3000,
    });
  });

  test("uses explicit environment values for the Stellar network", () => {
    expect(
      resolveNetworkConfiguration(
        { rpcUrl: "https://file.invalid", passphrase: "file passphrase" },
        {
          STELLAR_RPC_URL: "https://rpc.example",
          STELLAR_NETWORK_PASSPHRASE: "render passphrase",
        },
      ),
    ).toEqual({
      rpcUrl: "https://rpc.example",
      passphrase: "render passphrase",
    });
  });
});
