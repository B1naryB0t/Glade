/// <reference types="vitest" />
import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    ...configDefaults,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
    include: ["**/__tests__/**/*.{ts,tsx}", "**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
    },
    globals: true,
  },
});
