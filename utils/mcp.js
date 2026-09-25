// Minimal MCP (Model Context Protocol) server registry.
// Supports stdio-based MCP servers spawned as child processes and
// SSE/HTTP-based remote MCP servers polled over fetch.
//
// This is a self-contained, dependency-free implementation. It does NOT
// depend on the official @modelcontextprotocol/sdk package — that one is
// heavy, requires Node 20+, and pulls in dozens of transitive deps. For
// this use case (a code-gen assistant), a tiny client is enough.
//
// Each registered server exposes:
//   listTools()      -> [{ name, description, input_schema }]
//   callTool(name, args) -> { content: [{ type: 'text', text }] }

import { spawn } from "child_process";
import { randomUUID } from "crypto";

// In-memory registry. Persists for the lifetime of the server process.
// Restart of the Node process re-discovers from env var MCP_CONFIG (JSON).
const registry = new Map(); // id -> { config, transport, toolsCache, proc }

export function loadMcpConfigFromEnv() {
  const raw = process.env.MCP_CONFIG;
  if (!raw) return;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("[MCP] Failed to parse MCP_CONFIG env:", e.message);
    return;
  }
  if (!parsed || typeof parsed !== "object") return;
  for (const [id, cfg] of Object.entries(parsed)) {
    try {
      registerServer(id, cfg);
    } catch (e) {
      console.error(`[MCP] Failed to register server ${id}:`, e.message);
    }
  }
}

export function listRegisteredServers() {
  return Array.from(registry.entries()).map(([id, entry]) => ({
    id,
    config: entry.config,
    status: entry.status,
    tools: entry.toolsCache || [],
  }));
}

export async function registerServer(id, config) {
  if (registry.has(id)) {
    await unregisterServer(id);
  }
  const entry = {
    id,
    config,
    status: "connecting",
    transport: null,
    toolsCache: [],
    proc: null,
  };
  registry.set(id, entry);

  try {
    if (config.type === "stdio") {
      await connectStdio(entry);
    } else if (config.type === "http" || config.type === "sse") {
      await connectHttp(entry);
    } else {
      throw new Error(`Unknown MCP server type: ${config.type}`);
    }
    entry.status = "ready";
    await refreshTools(entry);
  } catch (e) {
    entry.status = "error";
    entry.error = e.message;
    console.error(`[MCP] ${id} connection failed:`, e.message);
  }
  return entry;
}

export async function unregisterServer(id) {
  const entry = registry.get(id);
  if (!entry) return;
  if (entry.proc) {
    try {
      entry.proc.kill();
    } catch {}
    entry.proc = null;
  }
  registry.delete(id);
}

async function connectStdio(entry) {
  const { command, args = [], env = {} } = entry.config;
  if (!command) throw new Error("stdio MCP server requires a 'command'");
  const proc = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  entry.proc = proc;
  entry.transport = "stdio";

  // Wire a tiny JSON-RPC handler
  entry._rpc = createStdioRpc(proc);
  proc.on("error", (err) => {
    entry.status = "error";
    entry.error = err.message;
  });
  proc.on("exit", (code) => {
    entry.status = "disconnected";
    entry.error = `process exited with code ${code}`;
  });
  // Initialize handshake
  await entry._rpc.call("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "deepsite", version: "1.0.0" },
  });
}

async function connectHttp(entry) {
  const { url } = entry.config;
  if (!url) throw new Error("http/sse MCP server requires a 'url'");
  entry.transport = "http";
  entry._rpc = createHttpRpc(url, entry.config.headers || {});
  await entry._rpc.call("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "deepsite", version: "1.0.0" },
  });
}

async function refreshTools(entry) {
  try {
    const result = await entry._rpc.call("tools/list", {});
    entry.toolsCache = result?.tools || [];
  } catch (e) {
    entry.toolsCache = [];
    entry.error = e.message;
  }
}

export async function listAllTools() {
  const out = [];
  for (const [id, entry] of registry.entries()) {
    if (entry.status !== "ready") continue;
    for (const tool of entry.toolsCache) {
      out.push({
        server: id,
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema || tool.input_schema || {},
      });
    }
  }
  return out;
}

export async function callMcpTool(serverId, toolName, args) {
  const entry = registry.get(serverId);
  if (!entry) throw new Error(`Unknown MCP server: ${serverId}`);
  if (entry.status !== "ready") throw new Error(`MCP server ${serverId} not ready (status: ${entry.status})`);
  const result = await entry._rpc.call("tools/call", {
    name: toolName,
    arguments: args || {},
  });
  return result;
}

// --- Transports ---

function createStdioRpc(proc) {
  let idCounter = 1;
  const pending = new Map();
  let buffer = "";

  proc.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    while (true) {
      const nl = buffer.indexOf("\n");
      if (nl === -1) break;
      const line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id && pending.has(msg.id)) {
          const { resolve, reject } = pending.get(msg.id);
          pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message || "RPC error"));
          else resolve(msg.result);
        }
        // notifications are ignored for now
      } catch (e) {
        // skip non-JSON lines
      }
    }
  });

  return {
    async call(method, params) {
      const id = idCounter++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        const msg = JSON.stringify({ jsonrpc: "2.0", id, method, params });
        proc.stdin.write(msg + "\n");
        setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id);
            reject(new Error(`MCP RPC timeout: ${method}`));
          }
        }, 15000);
      });
    },
  };
}

function createHttpRpc(baseUrl, headers) {
  let idCounter = 1;
  return {
    async call(method, params) {
      const id = idCounter++;
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(headers || {}),
        },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
      });
      if (!res.ok) throw new Error(`MCP HTTP ${res.status}: ${await res.text()}`);
      const msg = await res.json();
      if (msg.error) throw new Error(msg.error.message || "RPC error");
      return msg.result;
    },
  };
}

// Initialize on load
loadMcpConfigFromEnv();
