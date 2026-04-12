import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.mjs"],
    include: ["tests/unit/**/*.test.mjs"]
  }
});
