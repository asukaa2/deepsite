// Multi-provider registry
// Each provider defines: id, name, baseURL (default), docs URL, auth strategy,
// request format (openai | anthropic | gemini | ollama), and optional icon.

export const PROVIDERS = {
  openai: {
    id: "openai",
    name: "OpenAI",
    base_url: "https://api.openai.com/v1",
    docs: "https://platform.openai.com/docs/api-reference",
    format: "openai",
    icon: "openai.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "GPT-4o, GPT-4 Turbo, o1, o3, etc.",
    env: {
      key: "OPENAI_API_KEY",
      base: "OPENAI_BASE_URL",
      model: "OPENAI_MODEL",
    },
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    base_url: "https://api.deepseek.com/v1",
    docs: "https://api-docs.deepseek.com/",
    format: "openai",
    icon: "deepseek.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "DeepSeek-V3, DeepSeek-R1 (OpenAI-compatible)",
    env: {
      key: "DEEPSEEK_API_KEY",
      base: "DEEPSEEK_BASE_URL",
      model: "DEEPSEEK_MODEL",
    },
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    base_url: "https://api.anthropic.com/v1",
    docs: "https://docs.anthropic.com/en/api/messages",
    format: "anthropic",
    icon: "anthropic.svg",
    auth_header: "x-api-key",
    auth_prefix: "",
    description: "Claude 3.5 Sonnet, Opus, Haiku",
    env: {
      key: "ANTHROPIC_API_KEY",
      base: "ANTHROPIC_BASE_URL",
      model: "ANTHROPIC_MODEL",
    },
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    base_url: "https://generativelanguage.googleapis.com/v1beta",
    docs: "https://ai.google.dev/api/rest/v1beta",
    format: "gemini",
    icon: "gemini.svg",
    auth_header: "x-goog-api-key",
    auth_prefix: "",
    description: "Gemini 2.0 Flash, 2.5 Pro, etc.",
    env: {
      key: "GEMINI_API_KEY",
      base: "GEMINI_BASE_URL",
      model: "GEMINI_MODEL",
    },
  },
  mistral: {
    id: "mistral",
    name: "Mistral AI",
    base_url: "https://api.mistral.ai/v1",
    docs: "https://docs.mistral.ai/",
    format: "openai",
    icon: "mistral.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "Mistral Large, Codestral, Pixtral",
    env: {
      key: "MISTRAL_API_KEY",
      base: "MISTRAL_BASE_URL",
      model: "MISTRAL_MODEL",
    },
  },
  groq: {
    id: "groq",
    name: "Groq",
    base_url: "https://api.groq.com/openai/v1",
    docs: "https://console.groq.com/docs",
    format: "openai",
    icon: "groq.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "Ultra-fast Llama, Mixtral, DeepSeek on Groq",
    env: {
      key: "GROQ_API_KEY",
      base: "GROQ_BASE_URL",
      model: "GROQ_MODEL",
    },
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    base_url: "https://openrouter.ai/api/v1",
    docs: "https://openrouter.ai/docs",
    format: "openai",
    icon: "openrouter.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "Gateway to 200+ models (GPT, Claude, Gemini, Llama, etc.)",
    env: {
      key: "OPENROUTER_API_KEY",
      base: "OPENROUTER_BASE_URL",
      model: "OPENROUTER_MODEL",
    },
  },
  fireworks: {
    id: "fireworks",
    name: "Fireworks AI",
    base_url: "https://api.fireworks.ai/inference/v1",
    docs: "https://docs.fireworks.ai/",
    format: "openai",
    icon: "fireworks-ai.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "Fast inference for open-source models",
    env: {
      key: "FIREWORKS_API_KEY",
      base: "FIREWORKS_BASE_URL",
      model: "FIREWORKS_MODEL",
    },
  },
  together: {
    id: "together",
    name: "Together AI",
    base_url: "https://api.together.xyz/v1",
    docs: "https://docs.together.ai/",
    format: "openai",
    icon: "together.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "Open-source models with serverless endpoints",
    env: {
      key: "TOGETHER_API_KEY",
      base: "TOGETHER_BASE_URL",
      model: "TOGETHER_MODEL",
    },
  },
  novita: {
    id: "novita",
    name: "Novita AI",
    base_url: "https://api.novita.ai/v3/openai",
    docs: "https://docs.novita.ai/",
    format: "openai",
    icon: "novita.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "Cost-effective API for many open models",
    env: {
      key: "NOVITA_API_KEY",
      base: "NOVITA_BASE_URL",
      model: "NOVITA_MODEL",
    },
  },
  sambanova: {
    id: "sambanova",
    name: "SambaNova",
    base_url: "https://api.sambanova.ai/v1",
    docs: "https://docs.sambanova.ai/",
    format: "openai",
    icon: "sambanova.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "Fast inference for Llama / DeepSeek on SambaNova RDU",
    env: {
      key: "SAMBANOVA_API_KEY",
      base: "SAMBANOVA_BASE_URL",
      model: "SAMBANOVA_MODEL",
    },
  },
  hyperbolic: {
    id: "hyperbolic",
    name: "Hyperbolic",
    base_url: "https://api.hyperbolic.xyz/v1",
    docs: "https://docs.hyperbolic.xyz/",
    format: "openai",
    icon: "hyperbolic.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "GPU cloud + open model inference",
    env: {
      key: "HYPERBOLIC_API_KEY",
      base: "HYPERBOLIC_BASE_URL",
      model: "HYPERBOLIC_MODEL",
    },
  },
  nebius: {
    id: "nebius",
    name: "Nebius AI",
    base_url: "https://api.studio.nebius.ai/v1",
    docs: "https://docs.nebius.com/",
    format: "openai",
    icon: "nebius.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "Inference for open-source LLMs and vision models",
    env: {
      key: "NEBIUS_API_KEY",
      base: "NEBIUS_BASE_URL",
      model: "NEBIUS_MODEL",
    },
  },
  ollama: {
    id: "ollama",
    name: "Ollama (local)",
    base_url: "http://localhost:11434/v1",
    docs: "https://github.com/ollama/ollama/blob/main/docs/api.md",
    format: "openai",
    icon: "ollama.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "Run models locally with Ollama (OpenAI-compatible endpoint)",
    env: {
      key: "OLLAMA_API_KEY",
      base: "OLLAMA_BASE_URL",
      model: "OLLAMA_MODEL",
    },
    no_auth_required: true,
  },
  custom: {
    id: "custom",
    name: "Custom (OpenAI-compatible)",
    base_url: "",
    docs: "",
    format: "openai",
    icon: "custom.svg",
    auth_header: "Authorization",
    auth_prefix: "Bearer ",
    description: "Any OpenAI-compatible endpoint not in the list",
    env: {
      key: "CUSTOM_API_KEY",
      base: "CUSTOM_BASE_URL",
      model: "CUSTOM_MODEL",
    },
  },
};

// Suggested default models for each provider (shown in the UI dropdown)
export const PROVIDER_MODELS = {
  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4.1",
    "gpt-4.1-mini",
    "o1",
    "o1-mini",
    "o3",
    "o3-mini",
  ],
  deepseek: ["deepseek-chat", "deepseek-reasoner", "DeepSeek-V3", "DeepSeek-R1"],
  anthropic: [
    "claude-3-5-sonnet-latest",
    "claude-3-5-haiku-latest",
    "claude-3-7-sonnet-latest",
    "claude-opus-4-1",
    "claude-sonnet-4-5",
  ],
  gemini: [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-pro-preview-05-06",
    "gemini-2.5-flash",
  ],
  mistral: [
    "mistral-large-latest",
    "mistral-small-latest",
    "codestral-latest",
    "pixtral-large-latest",
    "open-mistral-nemo",
  ],
  groq: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "deepseek-r1-distill-llama-70b",
    "qwen-2.5-32b",
    "qwen-2.5-coder-32b",
  ],
  openrouter: [
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o",
    "google/gemini-2.0-flash-exp:free",
    "deepseek/deepseek-chat",
    "meta-llama/llama-3.3-70b-instruct",
    "qwen/qwen-2.5-coder-32b-instruct",
  ],
  fireworks: [
    "accounts/fireworks/models/llama-v3p3-70b-instruct",
    "accounts/fireworks/models/deepseek-v3",
    "accounts/fireworks/models/qwen2p5-coder-32b-instruct",
  ],
  together: [
    "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    "deepseek-ai/DeepSeek-V3",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
  ],
  novita: [
    "deepseek/deepseek-v3-0324",
    "deepseek/deepseek-r1",
    "qwen/qwen2.5-32b-instruct",
    "meta-llama/llama-3.3-70b-instruct",
  ],
  sambanova: [
    "Meta-Llama-3.3-70B-Instruct",
    "DeepSeek-V3-0324",
    "Qwen2.5-Coder-32B-Instruct",
  ],
  hyperbolic: [
    "meta-llama/Meta-Llama-3.1-70B-Instruct",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "deepseek-ai/DeepSeek-V3",
  ],
  nebius: [
    "meta-llama/Meta-Llama-3.1-70B-Instruct",
    "Qwen/Qwen2.5-32B-Instruct",
    "deepseek-ai/DeepSeek-V3-0324",
  ],
  ollama: [
    "llama3.2",
    "llama3.1",
    "qwen2.5-coder",
    "deepseek-r1",
    "mistral",
    "phi3",
    "gemma2",
  ],
  custom: [],
};

// Resolve the effective provider config for a request.
// Priority: client-supplied provider_id (built-in OR custom) >
//           client-supplied base_url (auto-detect) > env defaults
//
// Custom providers come from utils/customProviders.js (persisted to disk).
import {
  listCustomProviders,
  listCustomModels,
} from "./customProviders.js";

export function resolveProvider({
  provider_id,
  api_key,
  base_url,
  model,
}) {
  // 1. Built-in provider explicitly specified
  if (provider_id && PROVIDERS[provider_id]) {
    const p = PROVIDERS[provider_id];
    const envKey = process.env[p.env.key] || "";
    const envBase = process.env[p.env.base] || p.base_url || "";
    const envModel = process.env[p.env.model] || (PROVIDER_MODELS[p.id]?.[0] ?? "");
    return {
      provider: p,
      apiKey: api_key || envKey,
      baseUrl: base_url || envBase,
      model: model || envModel,
    };
  }

  // 1b. Custom provider explicitly specified
  if (provider_id) {
    const custom = listCustomProviders().find((p) => p.id === provider_id);
    if (custom) {
      return {
        provider: custom,
        apiKey: api_key || "",
        baseUrl: base_url || custom.base_url,
        model: model || (custom.suggested_models?.[0] ?? ""),
      };
    }
  }

  // 2. Auto-detect by base_url pattern
  if (base_url) {
    for (const [id, p] of Object.entries(PROVIDERS)) {
      if (id === "custom") continue;
      if (p.base_url && base_url.startsWith(p.base_url.replace(/\/v\d+.*$/, ""))) {
        return {
          provider: p,
          apiKey: api_key,
          baseUrl: base_url,
          model: model || (PROVIDER_MODELS[id]?.[0] ?? ""),
        };
      }
    }
  }

  // 3. Fall back to OpenAI provider (env-based)
  const openai = PROVIDERS.openai;
  return {
    provider: openai,
    apiKey: api_key || process.env.OPENAI_API_KEY || "",
    baseUrl: base_url || process.env.OPENAI_BASE_URL || openai.base_url,
    model: model || process.env.OPENAI_MODEL || PROVIDER_MODELS.openai[0],
  };
}

// Build the unified provider list returned by GET /api/providers.
// Merges built-in + custom, and overlays per-provider custom model suggestions.
export function getAllProviders() {
  const customModelsMap = listCustomModels();
  const builtIn = Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    name: p.name,
    base_url: p.base_url,
    description: p.description,
    format: p.format,
    no_auth_required: !!p.no_auth_required,
    suggested_models: [
      ...(PROVIDER_MODELS[p.id] || []),
      ...(customModelsMap[p.id] || []),
    ],
    env_keys: { key: p.env.key, base: p.env.base, model: p.env.model },
    custom: false,
  }));
  const custom = listCustomProviders().map((p) => ({
    id: p.id,
    name: p.name,
    base_url: p.base_url,
    description: p.description,
    format: p.format,
    no_auth_required: !!p.no_auth_required,
    suggested_models: [
      ...(p.suggested_models || []),
      ...(customModelsMap[p.id] || []),
    ],
    auth_header: p.auth_header,
    auth_prefix: p.auth_prefix,
    custom: true,
  }));
  return [...builtIn, ...custom];
}
