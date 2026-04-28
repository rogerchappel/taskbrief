import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm"],
  minify: false,
  outDir: "dist",
  platform: "node",
  shims: false,
  sourcemap: true,
  splitting: false,
  target: "node20"
});
