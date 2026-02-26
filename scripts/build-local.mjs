#!/usr/bin/env node
/**
 * Fast build for local server using esbuild (bundles api + local-server)
 */
import * as esbuild from "esbuild";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

async function build() {
  const outDir = join(root, "build");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  await esbuild.build({
    entryPoints: [join(root, "local-server.ts")],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: join(outDir, "local-server.js"),
    external: [
      "redis",
      "@vercel/kv",
      "@vercel/mcp-adapter",
      "@modelcontextprotocol/sdk",
      "jose",
    ],
    sourcemap: true,
    target: "node18",
  });
  console.log("✅ Built build/local-server.js");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
