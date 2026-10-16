import { create } from "zustand";

// A single provider entry from the backend /api/providers list
export interface ProviderInfo {
  id: string;
  name: string;
  base_url: string;
  description: string;
  format: "openai" | "anthropic" | "gemini";
  no_auth_required: boolean;
  suggested_models: string[];
  env_keys?: { key: string; base: string; model: string };
  // Custom-provider only fields
  custom?: boolean;
  auth_header?: string;
  auth_prefix?: string;
}

// Per-provider saved credentials/config the user enters in the UI
export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ProvidersState {
  providers: ProviderInfo[];
  // selected provider id
  current: string;
  // persisted configs per provider id
  configs: Record<string, ProviderConfig>;
  loaded: boolean;

  load: () => Promise<void>;
  setCurrent: (id: string) => void;
  setConfig: (id: string, cfg: Partial<ProviderConfig>) => void;
  getActive: () => { provider: ProviderInfo | undefined; cfg: ProviderConfig | undefined };

  // Custom provider/model management (calls backend; persists server-side)
  addCustomProvider: (p: {
    id: string;
    name: string;
    base_url?: string;
    format?: "openai" | "anthropic" | "gemini";
    description?: string;
    auth_header?: string;
    auth_prefix?: string;
    no_auth_required?: boolean;
    suggested_models?: string[];
  }) => Promise<boolean>;
  updateCustomProvider: (id: string, patch: any) => Promise<boolean>;
  removeCustomProvider: (id: string) => Promise<void>;
  addCustomModel: (providerId: string, model: string) => Promise<void>;
  removeCustomModel: (providerId: string, model: string) => Promise<void>;
}

const LS_KEY = "provider_configs_v1";
const LS_CURRENT = "current_provider_v1";

function loadInitialConfigs(): Record<string, ProviderConfig> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function loadInitialCurrent(): string {
  return localStorage.getItem(LS_CURRENT) || "openai";
}

export const useProvidersStore = create<ProvidersState>((set, get) => ({
  providers: [],
  current: loadInitialCurrent(),
  configs: loadInitialConfigs(),
  loaded: false,

  load: async () => {
    // Always reload the provider list so custom-provider changes from the
    // backend show up immediately.
    try {
      const res = await fetch("/api/providers");
      const data = await res.json();
      if (data.ok) {
        set({ providers: data.providers, loaded: true });
        // If the previously selected provider no longer exists (e.g. it was a
        // custom one that just got deleted), fall back to openai.
        const { current } = get();
        if (current && !data.providers.find((p: ProviderInfo) => p.id === current)) {
          set({ current: "openai" });
          localStorage.setItem(LS_CURRENT, "openai");
        }
      }
    } catch (e) {
      console.error("Failed to load providers", e);
    }
  },

  setCurrent: (id) => {
    localStorage.setItem(LS_CURRENT, id);
    set({ current: id });
  },

  setConfig: (id, cfg) => {
    const existing = get().configs[id] || { apiKey: "", baseUrl: "", model: "" };
    const merged = { ...existing, ...cfg };
    const configs = { ...get().configs, [id]: merged };
    localStorage.setItem(LS_KEY, JSON.stringify(configs));
    set({ configs });
  },

  getActive: () => {
    const { providers, current, configs } = get();
    return {
      provider: providers.find((p) => p.id === current),
      cfg: configs[current],
    };
  },

  addCustomProvider: async (p) => {
    try {
      const res = await fetch("/api/providers/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.message);
      await get().load();
      // Auto-select the newly added provider
      get().setCurrent(p.id);
      return true;
    } catch (e: any) {
      console.error("addCustomProvider failed:", e.message);
      throw e;
    }
  },

  updateCustomProvider: async (id, patch) => {
    try {
      const res = await fetch(`/api/providers/custom/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.message);
      await get().load();
      return true;
    } catch (e: any) {
      console.error("updateCustomProvider failed:", e.message);
      throw e;
    }
  },

  removeCustomProvider: async (id) => {
    try {
      const res = await fetch(`/api/providers/custom/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.message);
      // If the removed provider was the active one, switch to openai
      if (get().current === id) {
        get().setCurrent("openai");
      }
      // Drop its stored config too
      const configs = { ...get().configs };
      delete configs[id];
      localStorage.setItem(LS_KEY, JSON.stringify(configs));
      set({ configs });
      await get().load();
    } catch (e: any) {
      console.error("removeCustomProvider failed:", e.message);
      throw e;
    }
  },

  addCustomModel: async (providerId, model) => {
    try {
      const res = await fetch(
        `/api/providers/${encodeURIComponent(providerId)}/models`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model }),
        }
      );
      const d = await res.json();
      if (!d.ok) throw new Error(d.message);
      await get().load();
    } catch (e: any) {
      console.error("addCustomModel failed:", e.message);
      throw e;
    }
  },

  removeCustomModel: async (providerId, model) => {
    try {
      const res = await fetch(
        `/api/providers/${encodeURIComponent(providerId)}/models/${encodeURIComponent(model)}`,
        { method: "DELETE" }
      );
      const d = await res.json();
      if (!d.ok) throw new Error(d.message);
      await get().load();
    } catch (e: any) {
      console.error("removeCustomModel failed:", e.message);
      throw e;
    }
  },
}));
