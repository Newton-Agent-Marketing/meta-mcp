#!/usr/bin/env node
/**
 * Run local MCP server without tsx to avoid dependency IPC messages
 * that corrupt responses when Cursor spawns the process.
 *
 * Uses node with pre-built JS. Run `npm run build:local` first.
 * Falls back to tsx if build doesn't exist (for development).
 */

import { spawn } from "child_process";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const builtServer = join(root, "build", "local-server.js");

if (existsSync(builtServer)) {
  // Use pre-built JS - no tsx, no dependency messages
  const child = spawn(process.execPath, [builtServer], {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "development" },
  });
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  // Fallback: use tsx (may have issues when Cursor spawns)
  console.warn("Build not found. Run 'npm run build:local' first for best compatibility.");
  console.warn("Falling back to tsx (may crash when Cursor connects)...\n");
  const child = spawn("npx", ["tsx", "local-server.ts"], {
    stdio: "inherit",
    cwd: root,
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}
