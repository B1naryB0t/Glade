import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    include: ["**/__tests__/**/*.{ts,tsx}", "**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",            
      reporter: ["text", "lcov", "html"]
    },
    globals: true
  }
});
