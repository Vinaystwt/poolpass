import { describe, expect, test } from "vitest";

import { resolveApiBase } from "./backend-config.js";

describe("backend API base", () => {
  test("uses the public API when no deployment override is configured", () => {
    expect(resolveApiBase(undefined)).toBe("https://api.usepoolpass.xyz");
  });

  test("normalizes an explicit local development override", () => {
    expect(resolveApiBase("http://127.0.0.1:3000/")).toBe("http://127.0.0.1:3000");
  });
});
