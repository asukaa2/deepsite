// Skills system for DeepSite — claude-code-inspired.
//
// A "skill" is a named directive that, when activated, injects a prompt-snippet
// into the system prompt. Skills are surfaced as slash-commands in the chat
// (e.g. /ui-review, /a11y, /schema) — typing `/` opens a searchable menu.
//
// Skill shape:
//   {
//     id: string,             // slash-command identifier (lowercase-kebab)
//     name: string,           // human-readable name
//     description: string,    // shown in the slash menu
//     icon?: string,          // emoji or material symbol name
//     prompt: string,         // injected into system prompt verbatim
//     tags?: string[],        // for filtering / grouping
//     mcpTools?: string[],    // optional: MCP tools to enable when skill active
//     category?: string,      // 'design' | 'quality' | 'mobile' | 'fullstack' | 'data' | 'custom'
//     builtin?: boolean,      // true for defaults, false for user-added
//   }
//
// Sources (in priority order):
//   (a) SKILLS_CONFIG env var (JSON array)
//   (b) Runtime API (POST /api/skills)
//   (c) Built-in defaults below

const BUILTIN_SKILLS = [
  // ===== Design / UI quality =====
  {
    id: "ui-review",
    name: "UI/UX Reviewer",
    description: "Internal critique pass on layout, hierarchy, spacing, contrast. Auto-applies fixes.",
    icon: "design_services",
    prompt:
      "You are also a senior UI/UX reviewer. After drafting the page, internally review it for: visual hierarchy, spacing consistency, color contrast (WCAG AA), affordances, responsive behavior. Then emit the revised HTML.",
    tags: ["design", "quality"],
    category: "design",
    builtin: true,
  },
  {
    id: "a11y",
    name: "Accessibility Auditor",
    description: "WCAG 2.2 AA: alt text, ARIA roles, focus management, semantic landmarks, contrast.",
    icon: "accessibility",
    prompt:
      "Strictly follow WCAG 2.2 AA. Use semantic landmarks (header/main/nav/footer), provide alt text on every image, label every form field, ensure keyboard navigability, and keep color contrast >= 4.5:1 for text. Add a tabindex strategy and visible focus styles.",
    tags: ["a11y", "quality"],
    category: "quality",
    builtin: true,
  },
  {
    id: "dark-mode",
    name: "Dark Mode Injector",
    description: "Adds class-toggled dark mode with persistence and a toggle button.",
    icon: "dark_mode",
    prompt:
      "Implement a dark mode. Use Tailwind's 'dark:' variant (with class strategy) or CSS custom properties. Provide a visible toggle button (top-right), persist the user's choice in localStorage, and respect prefers-color-scheme on first visit.",
    tags: ["design", "theme"],
    category: "design",
    builtin: true,
  },
  {
    id: "responsive",
    name: "Mobile-First Responsive",
    description: "Forces mobile-first CSS, container queries where useful, and tested mobile/tablet/desktop layouts.",
    icon: "smartphone",
    prompt:
      "Design mobile-first. Use Tailwind's sm:/md:/lg: breakpoints (or CSS media queries) to layer on enhancements. Test mentally at 360px, 768px, 1280px. Avoid horizontal scroll. Use clamp() for fluid type and spacing where appropriate.",
    tags: ["responsive", "design"],
    category: "mobile",
    builtin: true,
  },

  // ===== SEO / Structured data =====
  {
    id: "schema",
    name: "Schema.org Injector",
    description: "Adds JSON-LD structured data (Article, Product, FAQ, BreadcrumbList, etc.).",
    icon: "data_object",
    prompt:
      "Detect the page type and inject a JSON-LD <script type='application/ld+json'> block using schema.org vocabulary. Pick the most specific type (Article, Product, FAQPage, BreadcrumbList, Organization, etc.). Fill as many fields as can be inferred.",
    tags: ["seo", "structured-data"],
    category: "quality",
    builtin: true,
  },
  {
    id: "i18n",
    name: "i18n Extractor",
    description: "Extracts visible strings into a key-based dictionary with data-i18n attributes + JS lookup.",
    icon: "translate",
    prompt:
      "Extract every visible user-facing string into a dictionary object in a <script> tag, and replace the inline text with <span data-i18n='key'></span>. Add a tiny i18n.apply(locale) function that walks [data-i18n] and sets textContent from the dictionary. Provide at least the original language as the default bundle.",
    tags: ["i18n", "localization"],
    category: "quality",
    builtin: true,
  },

  // ===== Performance / Quality =====
  {
    id: "perf",
    name: "Performance Optimizer",
    description: "Defers non-critical JS, lazy-loads images, inlines critical CSS, avoids layout thrash.",
    icon: "speed",
    prompt:
      "Optimize for first-paint and TTI: defer or async non-critical <script> tags, add loading='lazy' to below-the-fold images, inline critical CSS in a <style> block, use font-display: swap, and avoid forced layout shifts by reserving aspect-ratio on images and iframes.",
    tags: ["performance", "quality"],
    category: "quality",
    builtin: true,
  },
  {
    id: "forms",
    name: "Form Validator",
    description: "Adds client-side validation with accessible error messages.",
    icon: "rule",
    prompt:
      "For every form, add client-side validation. Show inline error messages linked via aria-describedby, set aria-invalid on failed fields, focus the first invalid field on submit, and prevent submission until valid. Do not rely on alert().",
    tags: ["forms", "a11y"],
    category: "quality",
    builtin: true,
  },
  {
    id: "api-mock",
    name: "API Mock Injector",
    description: "When the page needs backend data, mocks a fetch() with a realistic JSON payload.",
    icon: "cloud",
    prompt:
      "If the page requires backend data, do not call a real API. Instead, intercept fetch() with a small mock that returns realistic JSON matching the requested shape, and render the UI from that mock. Make the mock data comprehensive enough to demonstrate edge cases (empty, error, long list).",
    tags: ["data", "mock"],
    category: "data",
    builtin: true,
  },

  // ===== Mobile-specific =====
  {
    id: "native-pwa",
    name: "PWA Builder",
    description: "Adds a service worker, web manifest, and install prompt for an installable mobile app.",
    icon: "install_mobile",
    prompt:
      "Convert the page into an installable PWA. Add a <link rel='manifest'> with name, short_name, icons, theme_color, background_color, display: 'standalone'. Register a tiny inline service worker (via Blob URL or data URL) that caches the page for offline use. Add an install button that fires beforeinstallprompt.",
    tags: ["pwa", "mobile"],
    category: "mobile",
    builtin: true,
  },
  {
    id: "haptics",
    name: "Haptic Feedback",
    description: "Adds Navigator.vibrate() calls on tap, swipe, and submit events for mobile realism.",
    icon: "vibration",
    prompt:
      "Add subtle haptic feedback using navigator.vibrate() on key interactions: button taps (10ms), form submit success (15ms), form errors ([20, 40, 20]), and long-press (25ms). Guard with if (navigator.vibrate) so it degrades gracefully on desktop.",
    tags: ["mobile", "ux"],
    category: "mobile",
    builtin: true,
  },

  // ===== Full-stack =====
  {
    id: "auth-flow",
    name: "Auth Flow Designer",
    description: "Designs login + signup + password reset UI with mock auth and JWT-like session storage.",
    icon: "lock",
    prompt:
      "When generating a full-stack project, include a complete auth flow: signup form, login form, password reset request form, and a protected dashboard. Mock the backend with localStorage-backed session tokens (sha256-ish), show appropriate error states, and demonstrate route protection on the client side.",
    tags: ["auth", "fullstack"],
    category: "fullstack",
    builtin: true,
  },
  {
    id: "crud-rest",
    name: "CRUD REST Scaffold",
    description: "Generates a complete CRUD scaffold: list, create, edit, delete + REST endpoints with validation.",
    icon: "table",
    prompt:
      "When the user asks for a CRUD app, scaffold a complete REST API (Express-style) with: GET /items (list), GET /items/:id (read), POST /items (create), PUT /items/:id (update), DELETE /items/:id (delete). Add input validation, error responses with proper status codes, and a React UI that exercises every endpoint. Mock the database with an in-memory array.",
    tags: ["crud", "fullstack"],
    category: "fullstack",
    builtin: true,
  },
  {
    id: "rate-limit",
    name: "Rate Limiter",
    description: "Adds a simple in-memory rate limiter middleware to the Express server.",
    icon: "timer",
    prompt:
      "Add an in-memory rate limiter middleware to the Express server. Track requests per IP in a Map with a sliding window (default: 100 requests per 15 minutes). Return 429 Too Many Requests with a Retry-After header when exceeded. Document the env vars to tune the limit.",
    tags: ["security", "fullstack"],
    category: "fullstack",
    builtin: true,
  },

  // ===== Code quality =====
  {
    id: "code-review",
    name: "Code Reviewer",
    description: "Internal self-review pass: type-safety, error handling, edge cases, naming, comments.",
    icon: "rate_review",
    prompt:
      "Before emitting the final code, do an internal code-review pass. Check: type safety, error handling on every async call, edge cases (empty input, null, very long input, network failure), naming clarity, and adequate comments. Apply fixes silently and emit the revised code.",
    tags: ["quality", "review"],
    category: "quality",
    builtin: true,
  },
  {
    id: "tests",
    name: "Test Writer",
    description: "Adds a minimal test suite (Jest + RTL or Vitest) covering the core user flows.",
    icon: "science",
    prompt:
      "Add a minimal test suite using Vitest (frontend) and Jest/Supertest (backend). Cover at minimum: the main rendering path, one user interaction, one API endpoint success, one API endpoint error. Include a test script in package.json. Keep tests short but realistic.",
    tags: ["tests", "quality"],
    category: "quality",
    builtin: true,
  },
];

const customSkills = new Map();

export function listSkills() {
  const out = [];
  for (const s of BUILTIN_SKILLS) {
    if (customSkills.has(s.id)) out.push({ ...customSkills.get(s.id), builtin: false });
    else out.push(s);
  }
  for (const [id, s] of customSkills.entries()) {
    if (!BUILTIN_SKILLS.find((b) => b.id === id)) out.push({ ...s, builtin: false });
  }
  return out;
}

export function getSkill(id) {
  if (customSkills.has(id)) return { ...customSkills.get(id), builtin: false };
  const b = BUILTIN_SKILLS.find((s) => s.id === id);
  return b ? { ...b, builtin: true } : undefined;
}

export function registerSkill(skill) {
  if (!skill?.id) throw new Error("skill.id is required");
  customSkills.set(skill.id, { ...skill, builtin: false });
  return skill;
}

export function unregisterSkill(id) {
  return customSkills.delete(id);
}

export function loadSkillsFromEnv() {
  const raw = process.env.SKILLS_CONFIG;
  if (!raw) return;
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      for (const s of arr) registerSkill(s);
    }
  } catch (e) {
    console.error("[Skills] Failed to parse SKILLS_CONFIG env:", e.message);
  }
}

loadSkillsFromEnv();

export function buildSkillsPrompt(activeSkillIds) {
  if (!activeSkillIds || activeSkillIds.length === 0) return "";
  const lines = [
    "\n\nACTIVE_SKILLS: Apply each of these skill directives when producing the output. The user activated them by typing the corresponding slash command.",
  ];
  for (const id of activeSkillIds) {
    const skill = getSkill(id);
    if (!skill) continue;
    lines.push(`\n--- Skill: ${skill.name} (/${skill.id}) ---\n${skill.prompt}`);
  }
  return lines.join("\n");
}
