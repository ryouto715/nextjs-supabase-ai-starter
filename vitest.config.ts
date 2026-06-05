import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Vitest 4 で `environmentMatchGlobs` は削除されたため、ファイル名規約による
// node / jsdom の振り分けは `test.projects`（旧 workspace）で表現する。
//   *.page.test.tsx / *.component.test.tsx → jsdom（DOM が必要な UI テスト）
//   それ以外の *.test.ts / *.spec.ts        → node（純ロジック・統合テスト）
const SHARED_EXCLUDE = ["node_modules/**", "e2e/**", ".next/**"];
const DOM_GLOBS = ["src/**/*.{page,component}.{test,spec}.tsx"];

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
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
          exclude: [...SHARED_EXCLUDE, ...DOM_GLOBS],
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: DOM_GLOBS,
          exclude: SHARED_EXCLUDE,
        },
      },
    ],
  },
});
