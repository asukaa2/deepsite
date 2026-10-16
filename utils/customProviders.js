// Server-side registry for user-defined custom providers + per-provider custom
// model suggestions. Persisted to a JSON file under DATA_DIR so it survives
// server restarts and is shared across all clients.
//
// A custom provider has the same shape as a built-in PROVIDERS entry, plus
// `custom: true`. The server's resolveProvider() will look up custom
// providers by id so /api/ask-ai routes through the correct format adapter.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { PROVIDERS } from "./providers.js";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const CUSTOM_PROVIDERS_FILE = path.join(DATA_DIR, "custom_providers.json");
const CUSTOM_MODELS_FILE = path.join(DATA_DIR, "custom_models.json");

let customProviders = [];
let customModels = {}; // { providerId: [modelName, ...] }

function ensureDir() {
  if (!existsSync(DATA_DIR)) {
    try {
      mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error("[customProviders] mkdir error:", e.message);
    }
  }
}

function safeRead(file) {
  try {
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, "utf-8"));
    }
  } catch (e) {
    console.error(`[customProviders] read error ${file}:`, e.message);
  }
  return null;
}

function safeWrite(file, data) {
  try {
    ensureDir();
    writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`[customProviders] write error ${file}:`, e.message);
  }
}

export function loadCustomProviders() {
  customProviders = safeRead(CUSTOM_PROVIDERS_FILE) || [];
  customModels = safeRead(CUSTOM_MODELS_FILE) || {};
}

export function listCustomProviders() {
  return [...customProviders];
}

export function listCustomModels() {
  return JSON.parse(JSON.stringify(customModels));
}

function sanitizeId(id) {
  return String(id || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function addCustomProvider(p) {
  const id = sanitizeId(p.id);
  if (!id) throw new Error("id is required (lowercase, alphanumeric, dash or underscore)");
  if (!p.name) throw new Error("name is required");
  // Reject collisions with built-in providers
  if (PROVIDERS[id]) {
    throw new Error(`Provider id '${id}' is reserved (built-in). Choose a different id.`);
  }
  // Reject collisions with other custom providers
  if (customProviders.find((x) => x.id === id)) {
    throw new Error(`Custom provider '${id}' already exists`);
  }
  // Validate format explicitly — don't silently coerce
  const format = p.format || "openai";
  if (!["openai", "anthropic", "gemini"].includes(format)) {
    throw new Error(`format must be one of: openai, anthropic, gemini (got '${p.format}')`);
  }
  const entry = {
    id,
    name: String(p.name).trim(),
    base_url: String(p.base_url || "").trim(),
    description: String(p.description || "").trim(),
    format,
    auth_header: String(p.auth_header || "Authorization").trim() || "Authorization",
    auth_prefix: p.auth_prefix === undefined ? "Bearer " : String(p.auth_prefix),
    no_auth_required: !!p.no_auth_required,
    suggested_models: Array.isArray(p.suggested_models)
      ? p.suggested_models.map((s) => String(s).trim()).filter(Boolean)
      : [],
    custom: true,
  };
  customProviders.push(entry);
  safeWrite(CUSTOM_PROVIDERS_FILE, customProviders);
  return entry;
}

export function updateCustomProvider(id, patch) {
  const i = customProviders.findIndex((p) => p.id === id);
  if (i === -1) throw new Error(`Custom provider '${id}' not found`);
  const updated = { ...customProviders[i], ...patch, id, custom: true };
  if (patch.format && !["openai", "anthropic", "gemini"].includes(patch.format)) {
    throw new Error("format must be one of: openai, anthropic, gemini");
  }
  if (patch.suggested_models && !Array.isArray(patch.suggested_models)) {
    delete updated.suggested_models;
  }
  customProviders[i] = updated;
  safeWrite(CUSTOM_PROVIDERS_FILE, customProviders);
  return updated;
}

export function removeCustomProvider(id) {
  const before = customProviders.length;
  customProviders = customProviders.filter((p) => p.id !== id);
  if (customModels[id]) {
    delete customModels[id];
    safeWrite(CUSTOM_MODELS_FILE, customModels);
  }
  safeWrite(CUSTOM_PROVIDERS_FILE, customProviders);
  return customProviders.length < before;
}

export function addCustomModel(providerId, model) {
  if (!providerId || !model) return;
  if (!customModels[providerId]) customModels[providerId] = [];
  const m = String(model).trim();
  if (!m) return;
  if (!customModels[providerId].includes(m)) {
    customModels[providerId].push(m);
    safeWrite(CUSTOM_MODELS_FILE, customModels);
  }
}

export function removeCustomModel(providerId, model) {
  if (!customModels[providerId]) return;
  const m = String(model).trim();
  customModels[providerId] = customModels[providerId].filter((x) => x !== m);
  if (customModels[providerId].length === 0) delete customModels[providerId];
  safeWrite(CUSTOM_MODELS_FILE, customModels);
}

loadCustomProviders();
