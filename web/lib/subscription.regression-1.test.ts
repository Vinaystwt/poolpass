import { describe, expect, test } from "vitest";

import { defaultSubscribeAmount } from "./subscription.js";

describe("default subscribe amount", () => {
  test("uses 2,500 tUSDC unless the selected pool cap is lower", () => {
    expect(defaultSubscribeAmount("100000000000")).toBe("2500");
    expect(defaultSubscribeAmount("25000000000")).toBe("2500");
    expect(defaultSubscribeAmount("10000000000")).toBe("1000");
  });
});
