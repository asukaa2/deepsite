# DeepSite

[English](./README.en.md) | 中文

> Forked from [enzostvs/deepsite](https://huggingface.co/spaces/enzostvs/deepsite). Improved with multi-provider support, MCP (Model Context Protocol) integration, a Skills system, a Website Cloner, and a redesigned UI inspired by **chat.deepseek.com + VS Code**.

DeepSite is an AI-powered web app generator. Describe a page in natural language and the assistant streams back a single self-contained HTML file. The same engine can clone an existing website from a URL.

## What's new in this fork

- **16 LLM providers** out of the box: OpenAI, DeepSeek, Anthropic Claude, Google Gemini, Mistral, Groq, OpenRouter, Fireworks, Together, Novita, SambaNova, Hyperbolic, Nebius, Ollama (local), Custom (OpenAI-compatible). Each provider is auto-detected and routed through a format-specific adapter (openai / anthropic / gemini). Add or override credentials per-provider in the sidebar.
- **Custom providers + custom models from the UI** — the Providers sidebar panel has an "Add custom provider" form (id, name, base URL, request format, auth header/prefix, suggested models) so you can register your own OpenAI/Anthropic/Gemini-compatible endpoints without editing env vars. Custom providers are persisted server-side to `data/custom_providers.json` and survive restarts. The model dropdown for any provider (built-in or custom) can be augmented inline — add a custom model name and it appears in the suggestions list, persisted to `data/custom_models.json`.
- **MCP (Model Context Protocol)** — register any stdio or HTTP/SSE MCP server from the sidebar. Tools are auto-discovered and surfaced to the LLM; tool calls execute in a loop with tool_result messages appended automatically. Up to 6 iterations per request.
- **Skills system** — 9 built-in skills (UI/UX reviewer, accessibility auditor, schema.org injector, i18n extractor, performance optimizer, mobile-first responsive, dark-mode injector, form validator, API mock injector) plus the ability to register custom skills via env var or UI. Active skills inject directives into the system prompt.
- **Website Cloner** — paste any URL. The backend fetches and parses the page (title, sections, color palette, fonts, images, links) without a heavy DOM library, then prompts the LLM to recreate the page as a single self-contained TailwindCSS HTML file.
- **Redesigned UI** — VS Code-style activity bar + sidebar (Explorer / Providers / MCP / Skills / Cloner / Settings) on the left, a tabbed Editor/Preview in the middle, and a chat.deepseek.com-style chat panel on the right. Tool calls show up as inline chips in the chat stream.
- **Stack unchanged** — still Vite + React + TypeScript + Express. No Next.js, no SDK lock-in.

## Architecture

```
src/
  components/
    App.tsx                 # main layout
    header/                 # slim top bar
    sidebar/
      activity-bar.tsx
      sidebar.tsx
      panels/
        explorer-panel.tsx
        providers-panel.tsx
        mcp-panel.tsx
        skills-panel.tsx
        cloner-panel.tsx
        settings-panel.tsx
    chat/
      chat-panel.tsx        # streaming chat + tool-call UI
    editor/
      editor-preview.tsx    # VS Code-style tab strip + Monaco + iframe
    language-switcher/
  store/
    providersStore.ts       # 16 providers + per-provider credentials
    mcpStore.ts             # registered MCP servers + enabled tools
    skillsStore.ts          # built-in + custom + active skills
    chatStore.ts            # persisted chat history + abort support
utils/
  providers.js              # provider registry + resolveProvider()
  customProviders.js         # user-added custom providers + custom models (persisted to data/)
  llmAdapters.js            # openai / anthropic / gemini adapters
  llmWithTools.js           # tool-use loop (async generator)
  mcp.js                    # dependency-free MCP client (stdio + http)
  skills.js                 # built-in + custom skills
  cloner.js                 # URL -> outline -> LLM clone prompt
  templates.js              # HTML starter templates + CDN URLs
server.js                   # Express: /api/providers, /api/providers/custom, /api/providers/:id/models,
                            #   /api/ask-ai, /api/clone, /api/mcp/servers, /api/mcp/tools, /api/skills,
                            #   /api/test-connection, /api/optimize-prompt,
                            #   /api/check-env, /api/templates, /api/remix
```

## Quick start

```bash
cd deepsite
npm install
cp .env.example .env       # then edit .env (at least one provider)
npm run start:dev
# → Vite dev server on http://localhost:5173
# → Express API on http://localhost:3000
```

Open http://localhost:5173. Pick a provider in the sidebar, paste an API key, optionally add MCP servers / activate skills, then describe a page in the chat panel.

## Environment variables

See `.env.example` for the full list. Highlights:

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / ... | Default credentials for each provider (the UI also stores per-provider creds in localStorage). |
| `MCP_CONFIG` | JSON object of `{ id: { type, command, args, env } \| { type, url, headers } }` to register on startup. |
| `SKILLS_CONFIG` | JSON array of `{ id, name, description, prompt }` to register custom skills on startup. |
| `DATA_DIR` | Directory where the server persists user-added custom providers + per-provider custom model suggestions. Defaults to `./data`. Files: `custom_providers.json`, `custom_models.json`. |
| `DEFAULT_MAX_TOKENS` | Default `max_tokens` (64000). |
| `DEFAULT_TEMPERATURE` | Default `temperature` (0). |
| `IP_RATE_LIMIT` | Per-IP hourly request limit; 0 or unset = unlimited. |
| `APP_PORT` | Express port (default 3000). |

## Production

```bash
npm run build && npm run start
```

The Express server serves the built `dist/` and the API on `http://localhost:3000`.

## Vercel deployment

Use the Deploy button in the upstream README, set the env vars above, and set **Function Max Duration** to ≥ 60s in the project settings (streaming requests can take longer than the 10s free default).

## License

MIT
