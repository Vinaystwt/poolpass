import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    pool: "forks",
    include: ["{src,services,tests}/**/*.test.ts"],
    testTimeout: 30_000,
  },
});
