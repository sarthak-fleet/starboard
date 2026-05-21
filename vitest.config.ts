import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30000,
    // Playwright e2e specs live in ./e2e and run via `pnpm test:e2e`, not Vitest.
    exclude: ["node_modules", "dist", ".next", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["json", "text-summary"],
      exclude: [
        "node_modules",
        "dist",
        ".next",
        "coverage",
        "**/*.d.ts",
        "**/*.config.*",
        "**/test/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
