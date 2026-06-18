import { defineConfig } from "vite";
import { resolve } from "node:path";
import fs from "node:fs";
import { cjsDeprecationPlugin } from "./build/vite-plugin-cjs-deprecation";
import pkg from "./package.json";

const extDir = resolve(__dirname, "src/extensions");
const entries = Object.fromEntries(
  fs
    .readdirSync(extDir)
    .filter((file) => file.endsWith(".ts"))
    .map((file) => {
      const name = file.replace(/\.ts$/, "");
      return [`extensions/${name}`, resolve(extDir, file)];
    }),
);

export default defineConfig({
  plugins: [cjsDeprecationPlugin()],
  define: {
    __STORE2_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      store2: resolve(__dirname, "src/store2.ts"),
    },
  },
  build: {
    emptyOutDir: false,
    outDir: "dist",
    lib: {
      entry: entries,
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      external: ["store2"],
    },
  },
});
