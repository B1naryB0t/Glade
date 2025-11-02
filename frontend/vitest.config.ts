/// <reference types="vitest" />
import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // 👇 Fix: explicitly cast plugins as any[]
  plugins: [react()] as any,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    ...configDefaults,
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.js"],
    include: ["**/__tests__/**/*.{ts,tsx,js,jsx}", "**/*.{test,spec}.{ts,tsx,js,jsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx,js,jsx}"],
      exclude: ["**/__tests__/**", "**/mocks/**"],
    },
  },
});
