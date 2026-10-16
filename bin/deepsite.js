#!/usr/bin/env node
// DeepSite CLI entry point.
//
// Usage:
//   deepsite                 # start production server (auto-builds if needed)
//   deepsite start           # start production server only
//   deepsite dev             # start Vite dev server + Express API concurrently
//   deepsite build           # build the frontend into dist/
//   deepsite --help          # show this help
//   deepsite --port 8080     # override the port (default 3000)
//   deepsite --host 0.0.0.0  # bind to all interfaces
//
// Environment variables (optional):
//   APP_PORT          – server port (default 3000)
//   APP_HOST          – bind host (default 127.0.0.1)
//   OPENAI_API_KEY    – default provider credentials (or any other provider)
//   DATA_DIR          – where user data is persisted (default ./data)
//
// This script is invoked by `npm i -g github:asukaa2/deepsite` then `deepsite`.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_ROOT = path.resolve(__dirname, "..");

// Parse argv — extract flags and subcommand
const argv = process.argv.slice(2);
let subcommand = "start"; // default
const flags = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--help" || a === "-h") {
    printHelp();
    process.exit(0);
  } else if (a === "--version" || a === "-v") {
    printVersion();
    process.exit(0);
  } else if (a === "--port") {
    flags.port = argv[++i];
  } else if (a === "--host") {
    flags.host = argv[++i];
  } else if (a.startsWith("--port=")) {
    flags.port = a.slice("--port=".length);
  } else if (a.startsWith("--host=")) {
    flags.host = a.slice("--host=".length);
  } else if (!a.startsWith("-")) {
    subcommand = a;
  }
}

function printHelp() {
  console.log(`
DeepSite — AI-powered web app generator

Usage:
  deepsite                   Start production server (auto-builds if dist/ missing)
  deepsite start             Start production server only
  deepsite dev               Start Vite dev server + Express API concurrently
  deepsite build             Build the frontend into dist/
  deepsite --help, -h        Show this help
  deepsite --version, -v     Show version

Options:
  --port <number>            Override the server port (default 3000, env APP_PORT)
  --host <addr>              Bind host (default 127.0.0.1, env APP_HOST)

Environment variables:
  APP_PORT                   Server port (default 3000)
  APP_HOST                   Bind host (default 127.0.0.1)
  OPENAI_API_KEY             Default OpenAI API key (or any provider's *_API_KEY)
  DATA_DIR                    Where user data is persisted (default ./data)
  See .env.example for the full list.

Examples:
  deepsite
  deepsite --port 8080 --host 0.0.0.0
  deepsite dev
  APP_PORT=4000 deepsite start

Once running, open http://localhost:3000 in your browser.
`);
}

function printVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(path.join(PKG_ROOT, "package.json"), "utf-8")
    );
    console.log(`deepsite ${pkg.version || "0.0.0"}`);
  } catch {
    console.log("deepsite 0.0.0");
  }
}

function ensureDataDir() {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

function hasDist() {
  return existsSync(path.join(PKG_ROOT, "dist", "index.html"));
}

function runBuild() {
  console.log("[deepsite] Building frontend (this may take ~30s)…");
  // Build = tsc -b && vite build. tsc + vite are in dependencies (not
  // devDependencies) so this works on fresh global installs.
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "build"],
    { cwd: PKG_ROOT, stdio: "inherit" }
  );
  if (result.status !== 0) {
    console.error("[deepsite] Build failed. Run `deepsite build` manually for details.");
    process.exit(result.status ?? 1);
  }
  console.log("[deepsite] Build complete.");
}

function runServer() {
  ensureDataDir();
  const port = flags.port || process.env.APP_PORT || "3000";
  const host = flags.host || process.env.APP_HOST || "127.0.0.1";
  process.env.APP_PORT = port;
  process.env.APP_HOST = host;
  const serverPath = path.join(PKG_ROOT, "server.js");
  const child = spawn(
    process.execPath,
    [serverPath],
    { stdio: "inherit", env: process.env }
  );
  child.on("close", (code) => process.exit(code ?? 0));
  // Forward Ctrl-C
  process.on("SIGINT", () => {
    child.kill("SIGINT");
  });
  process.on("SIGTERM", () => {
    child.kill("SIGTERM");
  });
}

function runDev() {
  ensureDataDir();
  const port = flags.port || process.env.APP_PORT || "3000";
  process.env.APP_PORT = port;
  // Run vite + express concurrently. Use the local node_modules.
  const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(
    cmd,
    ["run", "start:dev"],
    { cwd: PKG_ROOT, stdio: "inherit", env: process.env }
  );
  child.on("close", (code) => process.exit(code ?? 0));
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}

// Main dispatch
switch (subcommand) {
  case "build":
    runBuild();
    break;
  case "start":
    if (!hasDist()) {
      console.log("[deepsite] dist/ not found — building first…");
      runBuild();
    }
    runServer();
    break;
  case "dev":
    runDev();
    break;
  default:
    console.error(`[deepsite] Unknown command: ${subcommand}`);
    printHelp();
    process.exit(1);
}
