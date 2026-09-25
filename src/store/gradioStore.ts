import { create } from "zustand";

export interface GradioServerInfo {
  id: string;
  status: "starting" | "running" | "stopped" | "error" | "connecting";
  pid: number | null;
  urls: {
    local: string | null;
    share: string | null;
    mcp: string | null;
  };
  shareRequested: boolean;
  mcpRequested: boolean;
  startedAt: number;
  stoppedAt: number | null;
  exitCode: number | null;
  error: string | null;
  logLineCount?: number;
  logs?: { t: number; kind: "stdout" | "stderr"; text: string }[];
  codePath?: string;
}

export interface GradioLogLine {
  t: number;
  kind: "stdout" | "stderr";
  text: string;
}

interface GradioState {
  servers: GradioServerInfo[];
  pythonAvailable: boolean | null;
  pythonPath: string | null;
  gradioVersion: string | null;
  pythonMessage: string | null;
  loaded: boolean;

  // editor state
  code: string;
  share: boolean;
  mcpServer: boolean;
  serverName: string;
  serverPort: number;

  // selected server for log viewing
  selectedId: string | null;
  selectedLogs: GradioLogLine[];

  load: () => Promise<void>;
  refreshList: () => Promise<void>;
  checkPython: () => Promise<void>;
  setCode: (code: string) => void;
  setShare: (b: boolean) => void;
  setMcpServer: (b: boolean) => void;
  setServerName: (s: string) => void;
  setServerPort: (n: number) => void;
  launch: () => Promise<GradioServerInfo | null>;
  stop: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  select: (id: string | null) => void;
  loadTemplate: () => Promise<void>;
  pollSelected: () => Promise<void>;
}

let pollTimer: any = null;

export const useGradioStore = create<GradioState>((set, get) => ({
  servers: [],
  pythonAvailable: null,
  pythonPath: null,
  gradioVersion: null,
  pythonMessage: null,
  loaded: false,

  code: "",
  share: true,
  mcpServer: true,
  serverName: "127.0.0.1",
  serverPort: 7860,

  selectedId: null,
  selectedLogs: [],

  load: async () => {
    if (get().loaded) return;
    await get().checkPython();
    await get().loadTemplate();
    await get().refreshList();
    set({ loaded: true });
    // Start background polling every 3s to refresh server status
    if (!pollTimer) {
      pollTimer = setInterval(() => {
        get().refreshList();
        if (get().selectedId) get().pollSelected();
      }, 3000);
    }
  },

  refreshList: async () => {
    try {
      const r = await fetch("/api/gradio/list");
      const d = await r.json();
      if (d.ok) set({ servers: d.servers });
    } catch {}
  },

  checkPython: async () => {
    try {
      const r = await fetch("/api/gradio/python-info");
      const d = await r.json();
      if (d.ok) {
        set({
          pythonAvailable: d.available,
          pythonPath: d.python,
          gradioVersion: d.gradioVersion,
          pythonMessage: d.message,
        });
      }
    } catch (e: any) {
      set({ pythonAvailable: false, pythonMessage: e.message });
    }
  },

  setCode: (code) => set({ code }),
  setShare: (share) => set({ share }),
  setMcpServer: (mcpServer) => set({ mcpServer }),
  setServerName: (serverName) => set({ serverName }),
  setServerPort: (serverPort) => set({ serverPort }),

  loadTemplate: async () => {
    try {
      const r = await fetch("/api/gradio/template");
      const d = await r.json();
      if (d.ok && d.template?.code) {
        // Only set if user hasn't typed anything yet
        if (!get().code) set({ code: d.template.code });
      }
    } catch {}
  },

  launch: async () => {
    const { code, share, mcpServer, serverName, serverPort } = get();
    if (!code.trim()) return null;
    try {
      const r = await fetch("/api/gradio/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          share,
          mcp_server: mcpServer,
          server_name: serverName,
          server_port: serverPort,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        await get().refreshList();
        set({ selectedId: d.server.id, selectedLogs: [] });
        return d.server;
      }
      return null;
    } catch {
      return null;
    }
  },

  stop: async (id) => {
    await fetch(`/api/gradio/stop/${id}`, { method: "POST" });
    await get().refreshList();
  },

  remove: async (id) => {
    await fetch(`/api/gradio/${id}`, { method: "DELETE" });
    if (get().selectedId === id) set({ selectedId: null, selectedLogs: [] });
    await get().refreshList();
  },

  select: (id) => {
    set({ selectedId: id, selectedLogs: [] });
    if (id) get().pollSelected();
  },

  pollSelected: async () => {
    const id = get().selectedId;
    if (!id) return;
    try {
      const r = await fetch(`/api/gradio/${id}`);
      const d = await r.json();
      if (d.ok) {
        const lastT = get().selectedLogs.length
          ? get().selectedLogs[get().selectedLogs.length - 1].t
          : 0;
        const r2 = await fetch(`/api/gradio/logs/${id}?since=${lastT}`);
        const d2 = await r2.json();
        if (d2.ok && d2.logs?.length) {
          set((state) => ({
            selectedLogs: [...state.selectedLogs, ...d2.logs].slice(-2000),
          }));
        }
        // Also refresh server list to pick up URL changes
        await get().refreshList();
      }
    } catch {}
  },
}));
