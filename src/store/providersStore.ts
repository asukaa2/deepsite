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
  env_keys: { key: string; base: string; model: string };
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
    if (get().loaded) return;
    try {
      const res = await fetch("/api/providers");
      const data = await res.json();
      if (data.ok) {
        set({ providers: data.providers, loaded: true });
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
}));
