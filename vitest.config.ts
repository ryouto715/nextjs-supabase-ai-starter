import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    passWithNoTests: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    environmentMatchGlobs: [
      ["**/*.page.test.tsx", "jsdom"],
      ["**/*.component.test.tsx", "jsdom"],
      ["**/*.test.ts", "node"],
    ],
  },
});
