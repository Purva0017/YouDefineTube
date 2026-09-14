import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    include: ["tests/**/*.test.ts"],
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: [
        "lib/**/*.ts",
        "hooks/**/*.ts",
        "components/**/*.{ts,tsx}",
        "core/**/*.ts",
        "contents/**/*.ts",
        "background.ts"
      ],
      exclude: [
        "**/*.d.ts",
        "**/node_modules/**",
        "**/.plasmo/**",
        "**/build/**",
        "**/tests/**",
        "test.ts"
      ],
      reporter: ["text", "html"],
      reportsDirectory: "./coverage"
    }
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, ".")
    }
  }
})
