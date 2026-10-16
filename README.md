# DeepSite

[English](./README.en.md) | 中文

> Forked from [enzostvs/deepsite](https://huggingface.co/spaces/enzostvs/deepsite). Improved with multi-provider support, MCP (Model Context Protocol) integration, a claude-code-inspired Skills system, a Website Cloner, **mobile / Android templates**, **full-stack multi-file project mode**, and a redesigned UI inspired by **grok.com**.

DeepSite is an AI-powered web app generator. Describe a page in natural language and the assistant streams back a single self-contained HTML file. The same engine can clone an existing website from a URL, or scaffold a complete multi-file full-stack project.

## What's new in this fork

- **16 LLM providers** out of the box: OpenAI, DeepSeek, Anthropic Claude, Google Gemini, Mistral, Groq, OpenRouter, Fireworks, Together, Novita, SambaNova, Hyperbolic, Nebius, Ollama (local), Custom (OpenAI-compatible). Each provider is auto-detected and routed through a format-specific adapter (openai / anthropic / gemini). Add or override credentials per-provider in the sidebar.
- **Custom providers + custom models from the UI** — the Providers sidebar panel has an "Add custom provider" form (id, name, base URL, request format, auth header/prefix, suggested models) so you can register your own OpenAI/Anthropic/Gemini-compatible endpoints without editing env vars. Custom providers are persisted server-side to `data/custom_providers.json` and survive restarts. The model dropdown for any provider (built-in or custom) can be augmented inline — add a custom model name and it appears in the suggestions list, persisted to `data/custom_models.json`.
- **MCP (Model Context Protocol)** — register any stdio or HTTP/SSE MCP server from the sidebar. Tools are auto-discovered and surfaced to the LLM; tool calls execute in a loop with tool_result messages appended automatically. Up to 6 iterations per request.
- **Skills system — claude-code-inspired** — 16 built-in skills across Design, Quality, Mobile, Full-stack, and Data categories, plus the ability to register custom skills via env var or UI. **Skills are now surfaced as slash-commands in the chat input**: type `/` to open a searchable menu, then arrow-key through candidates. Active skills inject directives into the system prompt. Built-ins include `/ui-review`, `/a11y`, `/schema`, `/dark-mode`, `/responsive`, `/perf`, `/forms`, `/i18n`, `/api-mock`, `/native-pwa`, `/haptics`, `/auth-flow`, `/crud-rest`, `/rate-limit`, `/code-review`, `/tests`.
- **Mobile / Android templates** — two new single-file templates that produce real mobile-style UIs:
  - `react-native-web` — uses react-native-web + React + Babel standalone; you get `<View>`, `<Text>`, `<TouchableOpacity>`, `<FlatList>`, `StyleSheet.create()` — the real RN primitives, rendered in the browser. Pair with the new mobile preview mode for an authentic phone-frame look.
  - `material-android` — uses `@material/web` Material 3 components (`<md-filled-button>`, `<md-fab>`, `<md-icon>`, `<md-list>`) with the Material You baseline color scheme. Looks like a native Android screen.
- **Mobile preview mode** — toggle between desktop and mobile preview in the editor toolbar. Mobile mode wraps the iframe in a 390px device frame with rounded corners and a notch, so you can see exactly how your page looks on a phone.
- **Full-stack multi-file project mode** — three new templates (`nextjs-fullstack`, `express-react`, `mern-stack`) generate complete multi-file projects. The LLM streams files wrapped in `<!--file:path-->…<!--/file-->` markers; the frontend parses them, opens each file in its own editor tab, and shows the file tree in the Explorer panel. The final HTML preview is appended after the file blocks.
- **Website Cloner** — paste any URL. The backend fetches and parses the page (title, sections, color palette, fonts, images, links) without a heavy DOM library, then prompts the LLM to recreate the page as a single self-contained TailwindCSS HTML file.
- **Redesigned UI — grok.com-inspired** — pure dark background, flat message bubbles (no shadows, no heavy borders), sharp corners, minimal accent. The activity bar + sidebar (Explorer / Providers / MCP / Skills / Cloner / Settings) sits on the left, a tabbed Editor/Preview with mobile/desktop toggle sits in the middle, and the chat panel on the right surfaces slash-commands and tool-call chips inline. Toasts and inputs match the grok.com dark aesthetic.
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

### Install as a global CLI (recommended)

```bash
npm i -g deepsite@github:asukaa2/deepsite
# The `prepare` script builds the frontend automatically during install.

deepsite                    # → http://localhost:3000  (auto-builds on first run if needed)
deepsite --port 8080        # → http://localhost:8080
deepsite --host 0.0.0.0     # → bind to all interfaces
deepsite dev                # → Vite dev + Express API (live reload, port 5173 + 3000)
deepsite build              # → rebuild the frontend only
deepsite --help             # → CLI help
deepsite --version          # → print version
```

Set your API key before launching (any of these works):

```bash
OPENAI_API_KEY=sk-... deepsite
# or
DEEPSEEK_API_KEY=... deepsite
# or export them in your shell, or write a .env in your CWD
```

The CLI persists user data (custom providers, custom models, MCP config) to `./data/` in your current working directory — so each project you run `deepsite` from has its own config.

### Run from source (development)

```bash
git clone https://github.com/asukaa2/deepsite.git
cd deepsite
npm install                 # also runs `prepare` → builds dist/
npm run start:dev           # → Vite on http://localhost:5173 + Express API on http://localhost:3000
```

Open http://localhost:5173. Pick a provider in the sidebar, paste an API key, optionally add MCP servers / activate skills, then describe a page in the chat panel.

### Production (Docker or self-host)

```bash
npm run build && npm run start
# Express serves dist/ + the API on http://localhost:3000
```

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
| `APP_HOST` | Express bind host (default `127.0.0.1`; set to `0.0.0.0` to expose on LAN). |

## Production

The CLI is production-ready:

```bash
deepsite --host 0.0.0.0 --port 80
```

The Express server serves the built `dist/` and the API from the same port. Use a process manager (`pm2`, `systemd`, Docker) to keep it alive.

## Vercel deployment

Use the Deploy button in the upstream README, set the env vars above, and set **Function Max Duration** to ≥ 60s in the project settings (streaming requests can take longer than the 10s free default).

## License

MIT
