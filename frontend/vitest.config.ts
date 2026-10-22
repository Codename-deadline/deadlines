import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    environment: "node",
    env: { VITE_API_BASE_URL: "" },
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
  },
});
