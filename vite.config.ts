import { defineConfig } from "vite";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";
import pkg from "./package.json";

const banner = `/*! ${pkg.name} - v${pkg.version} - ${new Date().toISOString().slice(0, 10)}
* Copyright (c) ${new Date().getFullYear()} ${(pkg.author as { name: string }).name}; Licensed ${pkg.license} */\n`;

const minBuild = process.env.BUILD_MIN === "1";

export default defineConfig({
  plugins: [
    dts({
      entryRoot: "src",
      include: ["src/store2.ts", "src/types.ts", "src/globals.d.ts"],
      outDir: "dist",
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  define: {
    __STORE2_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    emptyOutDir: !minBuild,
    minify: minBuild ? "esbuild" : false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/store2.ts"),
      name: "store",
      formats: minBuild ? ["iife"] : ["es", "iife"],
      fileName: (format) => {
        if (minBuild) return "store2.min.js";
        if (format === "es") return "store2.mjs";
        return "store2.js";
      },
    },
    rollupOptions: {
      output: {
        banner,
      },
    },
  },
});
