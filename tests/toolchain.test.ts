import { describe, expect, test } from "vitest";
import { expectedVersions, readVersions } from "../scripts/check-toolchain.js";

describe("pinned toolchain", () => {
  test("matches the versions required by deployed artifacts", async () => {
    expect(await readVersions()).toEqual(expectedVersions);
  });
});

