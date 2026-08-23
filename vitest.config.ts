import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import pkg from "./package.json";

export default defineConfig({
  define: {
    __STORE2_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      store2: resolve(__dirname, "src/store2.ts"),
    },
  },
  server: {
    host: "127.0.0.1",
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://127.0.0.1/",
      },
    },
    globals: true,
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/extensions/old.ts",
        "src/extensions/bind.ts",
        "src/extensions/dot.ts",
        "src/extensions/measure.ts",
      ],
      reporter: ["text", "text-summary", "json-summary"],
      thresholds: {
        lines: 99.9,
        functions: 100,
        branches: 97,
        statements: 99.9,
      },
    },
  },
});
