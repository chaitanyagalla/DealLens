import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/server/tests/**/*.test.ts", "src/client/tests/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
