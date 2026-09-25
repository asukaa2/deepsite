import { create } from "zustand";

export interface McpServerEntry {
  id: string;
  config: {
    type: "stdio" | "http" | "sse";
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
  };
  status: "connecting" | "ready" | "error" | "disconnected";
  tools: McpToolInfo[];
  error?: string;
}

export interface McpToolInfo {
  server: string;
  name: string;
  description: string;
  input_schema: any;
}

interface McpState {
  servers: McpServerEntry[];
  enabledTools: string[]; // "server/tool" strings
  loaded: boolean;

  load: () => Promise<void>;
  addServer: (id: string, config: any) => Promise<void>;
  removeServer: (id: string) => Promise<void>;
  toggleTool: (toolKey: string) => void;
  isToolEnabled: (toolKey: string) => boolean;
  clearTools: () => void;
}

export const useMcpStore = create<McpState>((set, get) => ({
  servers: [],
  enabledTools: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    try {
      const res = await fetch("/api/mcp/servers");
      const data = await res.json();
      if (data.ok) {
        set({ servers: data.servers, loaded: true });
      }
    } catch {}
    // restore enabled tools from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("mcp_enabled_tools") || "[]");
      set({ enabledTools: saved });
    } catch {}
  },

  addServer: async (id, config) => {
    const res = await fetch("/api/mcp/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, config }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || "Failed to add server");
    await get().load();
  },

  removeServer: async (id) => {
    await fetch(`/api/mcp/servers/${id}`, { method: "DELETE" });
    await get().load();
  },

  toggleTool: (toolKey) => {
    const cur = get().enabledTools;
    const next = cur.includes(toolKey)
      ? cur.filter((t) => t !== toolKey)
      : [...cur, toolKey];
    localStorage.setItem("mcp_enabled_tools", JSON.stringify(next));
    set({ enabledTools: next });
  },

  isToolEnabled: (toolKey) => get().enabledTools.includes(toolKey),

  clearTools: () => {
    localStorage.setItem("mcp_enabled_tools", "[]");
    set({ enabledTools: [] });
  },
}));
