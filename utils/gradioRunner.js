// Gradio Server runner.
// Spawns a Python subprocess running a generated Gradio Server (Gradio 6+)
// file, captures the local URL + share URL from stdout, and exposes
// lifecycle + log endpoints to the front-end.
//
// Requires Python 3.9+ and `gradio>=6` installed in the Python environment.
//
// A typical generated Gradio Server file looks like:
//
//   import gradio as gr
//   server = gr.Server()
//
//   @server.api
//   def add(a: int, b: int) -> int:
//       return a + b
//
//   if __name__ == "__main__":
//       server.launch(share=True, mcp_server=True, server_name="127.0.0.1", server_port=7860)
//
// The runner parses stdout for:
//   "* Running on local URL: http://127.0.0.1:7860"
//   "* Running on public URL: https://xxxx.gradio.live"
//   "* Streamable HTTP URL: http://127.0.0.1:7860/gradio/mcp/v1/sse"
// and forwards them to the client.

import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// In-memory registry of running servers
const running = new Map(); // id -> { id, proc, urls, logs, status, codePath, shareRequested, startedAt, pid }

// Find a working Python interpreter.
let cachedPython = null;
async function findPython() {
  if (cachedPython) return cachedPython;
  const candidates = [
    process.env.PYTHON_BIN,
    process.env.GRADIO_PYTHON,
    "python3",
    "python",
    "uv",
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      const { spawnSync } = await import("child_process");
      const r = spawnSync(c, ["--version"], { encoding: "utf-8" });
      if (r.status === 0 && /Python 3\.\d+/.test(r.stdout || r.stderr || "")) {
        // For `uv` we need `uv run python` — skip that complexity, prefer plain python
        if (c !== "uv") {
          cachedPython = c;
          return c;
        }
      }
    } catch {}
  }
  // Fallback: return the first candidate even if we couldn't verify
  return candidates[0] || "python3";
}

// Parse Gradio's stdout lines to find the URLs
function parseGradioLine(line, entry) {
  // "* Running on local URL: http://127.0.0.1:7860"
  let m = line.match(/Running on local URL:\s*(\S+)/);
  if (m) {
    entry.urls.local = m[1];
    entry.status = "running";
    return;
  }
  // "* Running on public URL: https://xxxx.gradio.live"
  m = line.match(/Running on public URL:\s*(\S+)/);
  if (m) {
    entry.urls.share = m[1];
    return;
  }
  // "* Streamable HTTP URL: http://.../gradio/mcp/v1/sse"
  m = line.match(/Streamable HTTP URL:\s*(\S+)/);
  if (m) {
    entry.urls.mcp = m[1];
    return;
  }
  // Could also try to grab a port from older-style output
  m = line.match(/Running on (?:http|https):\/\/[^:]+:(\d+)/);
  if (m && !entry.urls.local) {
    entry.urls.local = `http://127.0.0.1:${m[1]}`;
  }
}

export async function launchGradioServer({
  code,
  share = true,
  mcp_server = true,
  server_name = "127.0.0.1",
  server_port = 0, // 0 = let Python pick
  python_bin,
  env_overrides = {},
}) {
  if (!code) throw new Error("code is required");
  const python = python_bin || (await findPython());

  // Write code to a temp file
  const dir = mkdtempSync(path.join(tmpdir(), "deepsite-gradio-"));
  const codePath = path.join(dir, "server.py");
  writeFileSync(codePath, code, { encoding: "utf-8" });

  const id = randomUUID();
  const entry = {
    id,
    status: "starting",
    proc: null,
    pid: null,
    codePath,
    dir,
    urls: { local: null, share: null, mcp: null },
    logs: [],
    shareRequested: !!share,
    mcpRequested: !!mcp_server,
    startedAt: Date.now(),
    stoppedAt: null,
    exitCode: null,
    error: null,
  };
  running.set(id, entry);

  // Launch with env overrides so the script can be a normal `python server.py`
  // call. We pass the requested options via env vars so the user's script can
  // read them OR — if the script calls server.launch() with share=True — Gradio
  // will pick up GRADIO_SHARE / GRADIO_MCP_SERVER.
  const env = {
    ...process.env,
    GRADIO_SHARE: share ? "True" : "False",
    GRADIO_MCP_SERVER: mcp_server ? "True" : "False",
    ...env_overrides,
  };
  if (server_name) env.GRADIO_SERVER_NAME = server_name;
  if (server_port) env.GRADIO_SERVER_PORT = String(server_port);

  const proc = spawn(python, [codePath], {
    env,
    cwd: dir,
    stdio: ["ignore", "pipe", "pipe"],
  });
  entry.proc = proc;
  entry.pid = proc.pid;

  const handleStream = (stream, kind) => {
    let buf = "";
    stream.on("data", (chunk) => {
      buf += chunk.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        entry.logs.push({
          t: Date.now(),
          kind, // 'stdout' | 'stderr'
          text: line,
        });
        parseGradioLine(line, entry);
      }
      // Cap logs at 5000 lines to prevent unbounded growth
      if (entry.logs.length > 5000) {
        entry.logs = entry.logs.slice(-5000);
      }
    });
  };
  handleStream(proc.stdout, "stdout");
  handleStream(proc.stderr, "stderr");

  proc.on("error", (err) => {
    entry.status = "error";
    entry.error = err.message;
    entry.logs.push({
      t: Date.now(),
      kind: "stderr",
      text: `[runner] spawn error: ${err.message}`,
    });
  });

  proc.on("exit", (code, signal) => {
    entry.status = "stopped";
    entry.stoppedAt = Date.now();
    entry.exitCode = code;
    entry.logs.push({
      t: Date.now(),
      kind: "stderr",
      text: `[runner] process exited (code=${code}, signal=${signal})`,
    });
  });

  return entry;
}

export function listGradioServers() {
  return Array.from(running.values()).map((e) => ({
    id: e.id,
    status: e.status,
    pid: e.pid,
    urls: e.urls,
    shareRequested: e.shareRequested,
    mcpRequested: e.mcpRequested,
    startedAt: e.startedAt,
    stoppedAt: e.stoppedAt,
    exitCode: e.exitCode,
    error: e.error,
    logLineCount: e.logs.length,
  }));
}

export function getGradioServer(id) {
  const e = running.get(id);
  if (!e) return null;
  return {
    id: e.id,
    status: e.status,
    pid: e.pid,
    urls: e.urls,
    shareRequested: e.shareRequested,
    mcpRequested: e.mcpRequested,
    startedAt: e.startedAt,
    stoppedAt: e.stoppedAt,
    exitCode: e.exitCode,
    error: e.error,
    codePath: e.codePath,
    logs: e.logs,
  };
}

export function getGradioLogs(id, opts = {}) {
  const e = running.get(id);
  if (!e) return null;
  const since = opts.since || 0;
  return e.logs.filter((l) => l.t >= since);
}

export function stopGradioServer(id) {
  const e = running.get(id);
  if (!e) return false;
  if (e.proc && e.status !== "stopped" && e.status !== "error") {
    try {
      // SIGTERM first, escalate after 5s
      e.proc.kill("SIGTERM");
      setTimeout(() => {
        if (running.has(id) && running.get(id).status !== "stopped") {
          try {
            e.proc.kill("SIGKILL");
          } catch {}
        }
      }, 5000);
    } catch {}
  }
  // Cleanup temp dir after a short delay so the process can flush
  setTimeout(() => {
    try {
      rmSync(e.dir, { recursive: true, force: true });
    } catch {}
  }, 6000);
  return true;
}

export function deleteGradioServer(id) {
  stopGradioServer(id);
  return running.delete(id);
}
