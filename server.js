import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import { PROVIDERS, PROVIDER_MODELS, resolveProvider } from "./utils/providers.js";
import { COLORS } from "./utils/colors.js";
import { TEMPLATES, CDN_URLS } from "./utils/templates.js";
import {
  listRegisteredServers,
  registerServer,
  unregisterServer,
  listAllTools,
  callMcpTool,
} from "./utils/mcp.js";
import {
  listSkills,
  getSkill,
  registerSkill,
  unregisterSkill,
  buildSkillsPrompt,
} from "./utils/skills.js";
import { cloneWebsite, buildClonerPrompts } from "./utils/cloner.js";
import { runWithTools } from "./utils/llmWithTools.js";
import {
  launchGradioServer,
  listGradioServers,
  getGradioServer,
  getGradioLogs,
  stopGradioServer,
  deleteGradioServer,
} from "./utils/gradioRunner.js";

// Load environment variables from .env file
dotenv.config();

// Detect Vercel env
const isVercelEnvironment =
  process.env.VERCEL === "1" ||
  process.env.VERCEL === "true" ||
  !!process.env.VERCEL;

const IP_RATE_LIMIT = parseInt(process.env.IP_RATE_LIMIT) || 0;
const ipRequestCache = {};

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.APP_PORT || 3000;
const DEFAULT_MAX_TOKENS = process.env.DEFAULT_MAX_TOKENS || 64000;
const DEFAULT_TEMPERATURE = process.env.DEFAULT_TEMPERATURE || 0;

app.use(cookieParser());
app.use(bodyParser.json({ limit: "5mb" }));

const staticPath = isVercelEnvironment
  ? path.join(process.cwd(), "dist")
  : path.join(__dirname, "dist");
app.use(express.static(staticPath));

// IP rate-limit middleware (unchanged from original)
app.use((req, res, next) => {
  if (IP_RATE_LIMIT <= 0) {
    req.rateLimit = { limited: false };
    return next();
  }
  const clientIp =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress;

  if (
    req.path.startsWith("/assets/") ||
    req.path.endsWith(".js") ||
    req.path.endsWith(".css") ||
    req.path.endsWith(".ico") ||
    req.path.endsWith(".png") ||
    req.path.endsWith(".jpg") ||
    req.path.endsWith(".svg")
  ) {
    req.rateLimit = { limited: false };
    return next();
  }

  const now = Date.now();
  const hourAgo = now - 3600000;
  if (!ipRequestCache[clientIp]) ipRequestCache[clientIp] = [];
  ipRequestCache[clientIp] = ipRequestCache[clientIp].filter(
    (t) => t > hourAgo
  );
  const requestCount = ipRequestCache[clientIp].length;
  const remainingRequests = IP_RATE_LIMIT - requestCount;
  req.rateLimit = {
    limited: requestCount >= IP_RATE_LIMIT,
    requestCount,
    remainingRequests,
    clientIp,
  };

  if (req.rateLimit.limited) {
    const oldestRequest = Math.min(...ipRequestCache[clientIp]);
    const resetTime = oldestRequest + 3600000;
    const waitTimeMs = resetTime - now;
    const waitTimeMinutes = Math.ceil(waitTimeMs / 60000);
    const clientLang = req.headers["accept-language"] || "en";
    const isZhClient = clientLang.toLowerCase().includes("zh");
    console.log(
      `Rate limit exceeded for IP: ${clientIp}, can try again in ${waitTimeMinutes} minutes`
    );
    const message = isZhClient
      ? `请求频率超过限制，请在 ${waitTimeMinutes} 分钟后再试`
      : `Too many requests. Please try again in ${waitTimeMinutes} minutes.`;
    return res.status(429).send({
      ok: false,
      message: message,
      waitTimeMinutes: waitTimeMinutes,
      resetTime: resetTime,
    });
  }
  ipRequestCache[clientIp].push(now);

  if (!global.ipCacheCleanupInterval) {
    global.ipCacheCleanupInterval = setInterval(() => {
      const cleanupTime = Date.now() - 3600000;
      for (const ip in ipRequestCache) {
        ipRequestCache[ip] = ipRequestCache[ip].filter((t) => t > cleanupTime);
        if (ipRequestCache[ip].length === 0) delete ipRequestCache[ip];
      }
    }, 3600000);
  }
  next();
});

// ============================================================================
// TEMPLATES
// ============================================================================

app.get("/api/templates", (req, res) => {
  const templates = Object.keys(TEMPLATES).map((key) => ({
    id: key,
    name: TEMPLATES[key].name,
    description: TEMPLATES[key].description,
  }));
  return res.status(200).send({ ok: true, templates });
});

app.get("/api/templates/:id", (req, res) => {
  const { id } = req.params;
  if (!TEMPLATES[id]) {
    return res.status(404).send({ ok: false, message: "Template not found" });
  }
  const html = TEMPLATES[id].html;
  return res.status(200).send({
    ok: true,
    template: {
      id,
      name: TEMPLATES[id].name,
      description: TEMPLATES[id].description,
      systemPrompt: TEMPLATES[id].systemPrompt,
      html,
    },
  });
});

// ============================================================================
// PROVIDERS
// ============================================================================

app.get("/api/providers", (req, res) => {
  const providers = Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    name: p.name,
    base_url: p.base_url,
    description: p.description,
    format: p.format,
    no_auth_required: !!p.no_auth_required,
    suggested_models: PROVIDER_MODELS[p.id] || [],
    env_keys: {
      key: p.env.key,
      base: p.env.base,
      model: p.env.model,
    },
  }));
  return res.status(200).send({ ok: true, providers });
});

// Check env configuration status — also reports provider-specific env vars
app.get("/api/check-env", (req, res) => {
  const providerEnv = {};
  for (const [id, p] of Object.entries(PROVIDERS)) {
    providerEnv[id] = {
      apiKey: !!process.env[p.env.key],
      baseUrl: !!process.env[p.env.base],
      model: !!process.env[p.env.model],
      modelValue: process.env[p.env.model] || "",
    };
  }
  return res.status(200).send({
    ok: true,
    env: {
      apiKey: !!process.env.OPENAI_API_KEY,
      baseUrl: !!process.env.OPENAI_BASE_URL,
      model: !!process.env.OPENAI_MODEL,
    },
    model: process.env.OPENAI_MODEL || "",
    ipRateLimit: parseInt(process.env.IP_RATE_LIMIT) || 0,
    providerEnv,
  });
});

// Test connection (multi-provider)
app.post("/api/test-connection", async (req, res) => {
  const { provider_id, api_key, base_url, model } = req.body;
  try {
    const ctx = resolveProvider({ provider_id, api_key, base_url, model });
    if (!ctx.apiKey && !ctx.provider.no_auth_required) {
      return res
        .status(400)
        .send({ ok: false, message: "API key is required for testing" });
    }

    const body = {
      model: ctx.model,
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 50,
      temperature: 0,
    };
    const headers = { "Content-Type": "application/json" };
    headers[ctx.provider.auth_header] =
      ctx.provider.auth_prefix + (ctx.apiKey || "");

    let url = `${ctx.baseUrl.replace(/\/$/, "")}/chat/completions`;
    if (ctx.provider.format === "anthropic") {
      url = `${ctx.baseUrl.replace(/\/$/, "")}/messages`;
      headers["anthropic-version"] = "2023-06-01";
      body.messages = body.messages.filter((m) => m.role !== "system");
    } else if (ctx.provider.format === "gemini") {
      url = `${ctx.baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(
        ctx.model
      )}:generateContent`;
      body = {
        contents: [{ role: "user", parts: [{ text: "hi" }] }],
        generationConfig: { maxOutputTokens: 50, temperature: 0 },
      };
      delete headers[ctx.provider.auth_header];
      headers[ctx.provider.auth_header] = ctx.provider.auth_prefix + (ctx.apiKey || "");
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).send({
        ok: false,
        message: errData?.error?.message || "Connection test failed",
      });
    }
    return res.status(200).send({ ok: true, message: "Connection OK" });
  } catch (error) {
    return res
      .status(500)
      .send({ ok: false, message: error.message || "Connection test error" });
  }
});

// ============================================================================
// MCP SERVERS
// ============================================================================

app.get("/api/mcp/servers", (req, res) => {
  return res.status(200).send({ ok: true, servers: listRegisteredServers() });
});

app.post("/api/mcp/servers", async (req, res) => {
  const { id, config } = req.body;
  if (!id || !config) {
    return res.status(400).send({ ok: false, message: "id and config required" });
  }
  try {
    const entry = await registerServer(id, config);
    return res.status(200).send({ ok: true, server: entry });
  } catch (e) {
    return res.status(500).send({ ok: false, message: e.message });
  }
});

app.delete("/api/mcp/servers/:id", async (req, res) => {
  const { id } = req.params;
  await unregisterServer(id);
  return res.status(200).send({ ok: true });
});

app.get("/api/mcp/tools", async (req, res) => {
  const tools = await listAllTools();
  return res.status(200).send({ ok: true, tools });
});

app.post("/api/mcp/call", async (req, res) => {
  const { server, tool, args } = req.body;
  if (!server || !tool) {
    return res.status(400).send({ ok: false, message: "server and tool required" });
  }
  try {
    const result = await callMcpTool(server, tool, args || {});
    return res.status(200).send({ ok: true, result });
  } catch (e) {
    return res.status(500).send({ ok: false, message: e.message });
  }
});

// ============================================================================
// SKILLS
// ============================================================================

app.get("/api/skills", (req, res) => {
  return res.status(200).send({ ok: true, skills: listSkills() });
});

app.post("/api/skills", (req, res) => {
  const { skill } = req.body;
  if (!skill) {
    return res.status(400).send({ ok: false, message: "skill required" });
  }
  try {
    registerSkill(skill);
    return res.status(200).send({ ok: true, skill });
  } catch (e) {
    return res.status(500).send({ ok: false, message: e.message });
  }
});

app.delete("/api/skills/:id", (req, res) => {
  const { id } = req.params;
  unregisterSkill(id);
  return res.status(200).send({ ok: true });
});

// ============================================================================
// PROMPT OPTIMIZATION
// ============================================================================

app.post("/api/optimize-prompt", async (req, res) => {
  const {
    prompt,
    language,
    provider_id,
    api_key,
    base_url,
    model,
  } = req.body;
  if (!prompt) {
    return res.status(400).send({ ok: false, message: "Missing prompt field" });
  }
  try {
    const ctx = resolveProvider({ provider_id, api_key, base_url, model });
    if (!ctx.apiKey && !ctx.provider.no_auth_required) {
      return res
        .status(500)
        .send({ ok: false, message: "API key is not configured." });
    }

    const systemPrompt =
      language === "zh"
        ? "你是一个专业的提示词优化助手。你的任务是改进用户的提示词，使其更加清晰、具体和有效。保持用户的原始意图，但使提示词更加结构化，更容易被AI理解。只输出优化后的提示词文本，不要使用Markdown语法，不要添加任何解释、评论或额外标记。"
        : "You are a professional prompt optimization assistant. Improve the user's prompt to make it clearer, more specific, and more effective. Maintain the user's original intent. Output only the optimized prompt text without any Markdown syntax, explanations, or extra commentary.";

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ];

    const headers = { "Content-Type": "application/json" };
    headers[ctx.provider.auth_header] =
      ctx.provider.auth_prefix + (ctx.apiKey || "");

    let url, body, isAnthropic = false, isGemini = false;
    if (ctx.provider.format === "anthropic") {
      isAnthropic = true;
      headers["anthropic-version"] = "2023-06-01";
      const sysMsg = messages[0];
      const userMsg = messages[1];
      url = `${ctx.baseUrl.replace(/\/$/, "")}/messages`;
      body = {
        model: ctx.model,
        system: sysMsg.content,
        messages: [{ role: "user", content: userMsg.content }],
        max_tokens: 2000,
        temperature: 0.7,
      };
    } else if (ctx.provider.format === "gemini") {
      isGemini = true;
      url = `${ctx.baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(
        ctx.model
      )}:generateContent`;
      body = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
      };
    } else {
      url = `${ctx.baseUrl.replace(/\/$/, "")}/chat/completions`;
      body = {
        model: ctx.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).send({
        ok: false,
        message: errData?.error?.message || "Error calling LLM",
      });
    }
    const data = await response.json();
    let optimizedPrompt = "";
    if (isAnthropic) {
      optimizedPrompt = (data.content || [])
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("");
    } else if (isGemini) {
      optimizedPrompt = (data.candidates?.[0]?.content?.parts || [])
        .map((p) => p.text)
        .join("");
    } else {
      optimizedPrompt = data.choices?.[0]?.message?.content?.trim();
    }
    return res.status(200).send({ ok: true, optimizedPrompt });
  } catch (error) {
    return res
      .status(500)
      .send({ ok: false, message: error.message || "Optimization error" });
  }
});

// ============================================================================
// ASK AI (multi-provider, MCP tool support, skills)
// ============================================================================

app.post("/api/ask-ai", async (req, res) => {
  const {
    prompt,
    html,
    previousPrompt,
    templateId,
    language,
    ui,
    tools,
    max_tokens,
    temperature,
    provider_id,
    api_key,
    base_url,
    model,
    skills,
    mcp_tools,
  } = req.body;

  if (!prompt) {
    return res.status(400).send({ ok: false, message: "Missing required fields" });
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Keep-Alive", "timeout=120");
  res.flushHeaders();

  const ctx = resolveProvider({ provider_id, api_key, base_url, model });
  if (!ctx.apiKey && !ctx.provider.no_auth_required) {
    res.write(JSON.stringify({ ok: false, message: "API key is not configured." }));
    res.end();
    return;
  }

  // Build the base system prompt
  let systemPrompt =
    templateId && TEMPLATES[templateId]
      ? TEMPLATES[templateId].systemPrompt
      : TEMPLATES.vanilla.systemPrompt;

  if (ui && ui !== templateId && templateId === "vue3") {
    const uiTemplate = TEMPLATES[ui];
    if (uiTemplate) {
      systemPrompt += ` Also, use ${uiTemplate.name} component library with CDN: `;
      if (ui === "elementPlus") {
        systemPrompt += `CSS: ${CDN_URLS.ELEMENT_PLUS_CSS}, JS: ${CDN_URLS.ELEMENT_PLUS_JS}, Icons: ${CDN_URLS.ELEMENT_PLUS_ICONS}.`;
      } else if (ui === "naiveUI") {
        systemPrompt += `${CDN_URLS.NAIVE_UI}.`;
      }
    }
  }

  if (tools && tools.length > 0) {
    systemPrompt += " Include the following additional libraries: ";
    tools.forEach((tool, index) => {
      if (tool === "tailwindcss") {
        systemPrompt += `Tailwind CSS (use <script src="${CDN_URLS.TAILWIND}"></script>)`;
      } else if (tool === "vueuse") {
        systemPrompt += `VueUse (use <script src="${CDN_URLS.VUEUSE_SHARED}"></script> and <script src="${CDN_URLS.VUEUSE_CORE}"></script>)`;
      } else if (tool === "dayjs") {
        systemPrompt += `Day.js (use <script src="${CDN_URLS.DAYJS}"></script>)`;
      } else if (tool === "element-plus-icons") {
        systemPrompt += `Element Plus Icons (use <script src="${CDN_URLS.ELEMENT_PLUS_ICONS}"></script>)`;
      }
      if (index < tools.length - 1) systemPrompt += ", ";
    });
    systemPrompt += ". Make sure to use the correct syntax for all frameworks and libraries.";
  }

  // Inject skill prompts
  if (skills && skills.length > 0) {
    systemPrompt += buildSkillsPrompt(skills);
  }

  if (language === "zh") {
    systemPrompt += " 请使用中文编写所有的注释。";
  } else if (language === "en") {
    systemPrompt += " Please write all comments in English.";
  }

  console.log(
    `[ask-ai] provider=${ctx.provider.id} model=${ctx.model} skills=${
      skills?.length || 0
    } mcp_tools=${mcp_tools?.length || 0}`
  );

  const messages = [{ role: "system", content: systemPrompt }];
  if (previousPrompt) {
    messages.push({ role: "user", content: previousPrompt });
  }
  if (html) {
    messages.push({ role: "assistant", content: `The current code is: ${html}.` });
  }
  messages.push({ role: "user", content: prompt });

  const unified = {
    model: ctx.model,
    messages,
    max_tokens: max_tokens || parseInt(DEFAULT_MAX_TOKENS),
    temperature: temperature !== undefined ? parseFloat(temperature) : parseFloat(DEFAULT_TEMPERATURE),
    stream: true,
  };

  try {
    const generator = runWithTools({
      unified,
      provider: ctx.provider,
      apiKey: ctx.apiKey,
      baseUrl: ctx.baseUrl,
      enabledTools: mcp_tools || [],
    });

    let completeResponse = "";
    for await (const ev of generator) {
      if (res.writableEnded) break;
      if (ev.type === "text") {
        res.write(ev.content);
        completeResponse += ev.content;
      } else if (ev.type === "tool_event") {
        // Send a comment-line that the client can optionally parse for UI
        const json = JSON.stringify(ev.content);
        res.write(`\n<!--mcp:${json}-->\n`);
      } else if (ev.type === "error") {
        res.write(`\n[error] ${ev.content}\n`);
      }
      if (completeResponse.includes("</html>")) {
        break;
      }
    }
    if (!res.writableEnded) res.end();
  } catch (error) {
    console.error("[ask-ai] error:", error);
    if (!res.headersSent) {
      res.status(500).send({ ok: false, message: error.message });
    } else if (!res.writableEnded) {
      res.write(`\n[error] ${error.message}\n`);
      res.end();
    }
  }
});

// ============================================================================
// WEBSITE CLONER
// ============================================================================

// Just fetch the skeleton — no LLM call. Useful to preview what will be sent.
app.post("/api/clone/skeleton", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).send({ ok: false, message: "url is required" });
  }
  try {
    const data = await cloneWebsite(url);
    return res.status(200).send({ ok: true, ...data });
  } catch (e) {
    return res.status(500).send({ ok: false, message: e.message });
  }
});

// Clone + generate: stream the recreated HTML back to the client (same
// streaming contract as /api/ask-ai).
app.post("/api/clone", async (req, res) => {
  const {
    url,
    provider_id,
    api_key,
    base_url,
    model,
    skills,
    mcp_tools,
    max_tokens,
    temperature,
    language,
  } = req.body;
  if (!url) {
    return res.status(400).send({ ok: false, message: "url is required" });
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let cloneData;
  try {
    cloneData = await cloneWebsite(url);
  } catch (e) {
    res.write(`[error] Failed to clone URL: ${e.message}`);
    res.end();
    return;
  }

  const { systemPrompt, userPrompt } = buildClonerPrompts(cloneData);
  const ctx = resolveProvider({ provider_id, api_key, base_url, model });
  if (!ctx.apiKey && !ctx.provider.no_auth_required) {
    res.write(JSON.stringify({ ok: false, message: "API key not configured" }));
    res.end();
    return;
  }

  let fullSystem = systemPrompt;
  if (skills && skills.length > 0) {
    fullSystem += buildSkillsPrompt(skills);
  }
  if (language === "zh") {
    fullSystem += " 请使用中文编写所有的注释。";
  }

  const messages = [
    { role: "system", content: fullSystem },
    { role: "user", content: userPrompt },
  ];

  const unified = {
    model: ctx.model,
    messages,
    max_tokens: max_tokens || parseInt(DEFAULT_MAX_TOKENS),
    temperature: temperature !== undefined ? parseFloat(temperature) : 0.2,
    stream: true,
  };

  console.log(
    `[clone] url=${url} provider=${ctx.provider.id} model=${ctx.model}`
  );

  try {
    const generator = runWithTools({
      unified,
      provider: ctx.provider,
      apiKey: ctx.apiKey,
      baseUrl: ctx.baseUrl,
      enabledTools: mcp_tools || [],
    });

    let completeResponse = "";
    for await (const ev of generator) {
      if (res.writableEnded) break;
      if (ev.type === "text") {
        res.write(ev.content);
        completeResponse += ev.content;
      } else if (ev.type === "tool_event") {
        const json = JSON.stringify(ev.content);
        res.write(`\n<!--mcp:${json}-->\n`);
      } else if (ev.type === "error") {
        res.write(`\n[error] ${ev.content}\n`);
      }
      if (completeResponse.includes("</html>")) break;
    }
    if (!res.writableEnded) res.end();
  } catch (error) {
    console.error("[clone] error:", error);
    if (!res.headersSent) {
      res.status(500).send({ ok: false, message: error.message });
    } else if (!res.writableEnded) {
      res.write(`\n[error] ${error.message}\n`);
      res.end();
    }
  }
});

// ============================================================================
// GRADIO SERVER (Gradio 6+)
// ============================================================================

// IMPORTANT: static path routes MUST come before /:id routes so Express
// doesn't treat 'list', 'template', 'python-info' as ids.

// List all running + recently-stopped servers
app.get("/api/gradio/list", (req, res) => {
  return res.status(200).send({ ok: true, servers: listGradioServers() });
});

// Get the built-in Gradio template (so the front-end can pre-fill the editor)
app.get("/api/gradio/template", (req, res) => {
  const t = TEMPLATES["gradio-server"];
  if (!t) return res.status(404).send({ ok: false, message: "Template not found" });
  return res.status(200).send({
    ok: true,
    template: {
      id: "gradio-server",
      name: t.name,
      description: t.description,
      systemPrompt: t.systemPrompt,
      code: t.html,
    },
  });
});

// Detect Python availability
app.get("/api/gradio/python-info", async (req, res) => {
  try {
    const { spawnSync } = await import("child_process");
    const candidates = [
      process.env.PYTHON_BIN,
      process.env.GRADIO_PYTHON,
      "python3",
      "python",
    ].filter(Boolean);
    let found = null;
    for (const c of candidates) {
      const r = spawnSync(c, ["--version"], { encoding: "utf-8" });
      if (r.status === 0 && /Python 3\.\d+/.test(r.stdout || r.stderr || "")) {
        found = c;
        break;
      }
    }
    if (!found) {
      return res.status(200).send({
        ok: true,
        available: false,
        message: "No Python 3.x interpreter found. Install Python 3.9+ and pip install gradio>=6.",
      });
    }
    // Check gradio version
    const r = spawnSync(found, ["-c", "import gradio; print(gradio.__version__)"], {
      encoding: "utf-8",
    });
    const gradioVersion = (r.stdout || "").trim();
    const gradioOk = r.status === 0 && /^\d+\.\d+/.test(gradioVersion);
    return res.status(200).send({
      ok: true,
      available: gradioOk,
      python: found,
      gradioVersion: gradioOk ? gradioVersion : null,
      message: gradioOk
        ? null
        : "Gradio not installed. Run: pip install 'gradio>=6'",
    });
  } catch (e) {
    return res.status(500).send({ ok: false, message: e.message });
  }
});

// Launch a Python Gradio Server (Gradio 6+) — spawns a subprocess, parses
// stdout for share/local/MCP URLs, returns the entry id immediately.
app.post("/api/gradio/launch", async (req, res) => {
  const {
    code,
    share = true,
    mcp_server = true,
    server_name = "127.0.0.1",
    server_port = 0,
    python_bin,
    env_overrides,
  } = req.body;
  if (!code) {
    return res.status(400).send({ ok: false, message: "code is required" });
  }
  try {
    const entry = await launchGradioServer({
      code,
      share,
      mcp_server,
      server_name,
      server_port: server_port ? parseInt(server_port) : 0,
      python_bin,
      env_overrides,
    });
    return res.status(200).send({
      ok: true,
      server: {
        id: entry.id,
        status: entry.status,
        pid: entry.pid,
        codePath: entry.codePath,
        urls: entry.urls,
        shareRequested: entry.shareRequested,
        mcpRequested: entry.mcpRequested,
        startedAt: entry.startedAt,
      },
    });
  } catch (e) {
    return res.status(500).send({ ok: false, message: e.message });
  }
});

// Stream logs (or return them as a JSON array). 3-segment path, no :id conflict.
app.get("/api/gradio/logs/:id", (req, res) => {
  const id = req.params.id;
  const since = parseInt(req.query.since) || 0;
  if (req.headers.accept && req.headers.accept.includes("text/event-stream")) {
    // SSE streaming of new log lines
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    let lastSent = since;
    const interval = setInterval(() => {
      const entry = getGradioServer(id);
      if (!entry) {
        res.write("event: end\ndata: server-gone\n\n");
        clearInterval(interval);
        res.end();
        return;
      }
      const logs = getGradioLogs(id, { since: lastSent });
      for (const l of logs) {
        res.write(`data: ${JSON.stringify(l)}\n\n`);
        lastSent = Math.max(lastSent, l.t + 1);
      }
      if (entry.status === "stopped" || entry.status === "error") {
        // Flush a final close event after giving logs a chance to drain
        setTimeout(() => {
          res.write("event: end\ndata: stopped\n\n");
          res.end();
          clearInterval(interval);
        }, 500);
      }
    }, 400);
    // Allow client to stop the stream
    req.on("close", () => clearInterval(interval));
  } else {
    const logs = getGradioLogs(id, { since });
    if (logs === null) {
      return res.status(404).send({ ok: false, message: "Server not found" });
    }
    return res.status(200).send({ ok: true, logs, since });
  }
});

// Stop a server (SIGTERM -> SIGKILL after 5s). 3-segment path.
app.post("/api/gradio/stop/:id", (req, res) => {
  const ok = stopGradioServer(req.params.id);
  if (!ok) return res.status(404).send({ ok: false, message: "Server not found" });
  return res.status(200).send({ ok: true });
});

// Get details for one server (dynamic id — must come AFTER all static 2-segment routes)
app.get("/api/gradio/:id", (req, res) => {
  const entry = getGradioServer(req.params.id);
  if (!entry) {
    return res.status(404).send({ ok: false, message: "Server not found" });
  }
  return res.status(200).send({ ok: true, server: entry });
});

// Permanently delete a server entry (stop + remove from registry)
app.delete("/api/gradio/:id", (req, res) => {
  const ok = deleteGradioServer(req.params.id);
  if (!ok) return res.status(404).send({ ok: false, message: "Server not found" });
  return res.status(200).send({ ok: true });
});

// ============================================================================
// DEPLOY (stub, original feature removed)
// ============================================================================

app.post("/api/deploy", async (req, res) => {
  return res.status(200).send({
    ok: true,
    message: "Deployment feature has been removed as it required Hugging Face login",
  });
});

// ============================================================================
// REMIX (HF Spaces, unchanged)
// ============================================================================

const getPTag = (repoId) => {
  return `<p style="border-radius: 8px; text-align: center; font-size: 12px; color: #fff; margin-top: 16px;position: fixed; left: 8px; bottom: 8px; z-index: 10; background: rgba(0, 0, 0, 0.8); padding: 4px 8px;">Made with <img src="https://enzostvs-deepsite.hf.space/logo.svg" alt="DeepSite Logo" style="width: 16px; height: 16px; vertical-align: middle;display:inline-block;margin-right:3px;filter:brightness(0) invert(1);"><a href="https://enzostvs-deepsite.hf.space" style="color: #fff;text-decoration: underline;" target="_blank" >DeepSite</a> - <a href="https://enzostvs-deepsite.hf.space?remix=${repoId}" style="color: #fff;text-decoration: underline;" target="_blank" >🧬 Remix</a></p>`;
};

app.get("/api/remix/:username/:repo", async (req, res) => {
  const { username, repo } = req.params;
  const { hf_token } = req.cookies;
  const token = hf_token || process.env.DEFAULT_HF_TOKEN;
  const repoId = `${username}/${repo}`;
  // Minimal: just fetch the index.html of the space
  const url = `https://huggingface.co/spaces/${repoId}/raw/main/index.html`;
  const response = await fetch(url);
  if (!response.ok) {
    return res.status(404).send({ ok: false, message: "Space not found" });
  }
  let html = await response.text();
  try {
    html = html.replace(getPTag(repoId), "");
  } catch {}
  res.status(200).send({ ok: true, html });
});

// ============================================================================
// FALLBACK (SPA)
// ============================================================================

app.get("*", (_req, res) => {
  const indexPath = isVercelEnvironment
    ? path.join(process.cwd(), "dist", "index.html")
    : path.join(__dirname, "dist", "index.html");
  res.sendFile(indexPath);
});

if (!isVercelEnvironment) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
