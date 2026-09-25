// Skills system for DeepSite.
//
// A "skill" is a named prompt-snippet + optional MCP tool-bindings that
// gets injected into the system prompt when the user activates the skill.
// Examples:
//   - "ui-ux-reviewer": enables a critique-pass on generated UI
//   - "accessibility-auditor": runs an a11y checklist on the HTML
//   - "schema-org-injector": adds JSON-LD structured data
//   - "i18n-extractor": extracts strings into a translation table
//
// Skills are defined either:
//   (a) via the SKILLS_CONFIG env var (JSON array)
//   (b) via a runtime API (POST /api/skills)
//   (c) via the built-in defaults below
//
// Each skill object shape:
//   {
//     id: string,
//     name: string,
//     description: string,
//     icon?: string (emoji or icon name),
//     prompt: string,        // injected into system prompt verbatim
//     mcpTools?: string[],   // optional: list of "serverId/toolName" to enable
//     tags?: string[],
//   }

const BUILTIN_SKILLS = [
  {
    id: "ui-ux-reviewer",
    name: "UI/UX Reviewer",
    description:
      "Before producing final HTML, run an internal critique pass on layout, hierarchy, spacing, color contrast, and affordances. Apply fixes.",
    icon: "design_services",
    prompt:
      "You are also a senior UI/UX reviewer. After drafting the page, internally review it for: visual hierarchy, spacing consistency, color contrast (WCAG AA), affordances, responsive behavior. Then emit the revised HTML.",
    tags: ["design", "quality"],
  },
  {
    id: "accessibility-auditor",
    name: "Accessibility Auditor",
    description:
      "Guarantees WCAG 2.2 AA: alt text, ARIA roles, focus management, semantic landmarks, color contrast.",
    icon: "accessibility",
    prompt:
      "Strictly follow WCAG 2.2 AA. Use semantic landmarks (header/main/nav/footer), provide alt text on every image, label every form field, ensure keyboard navigability, and keep color contrast >= 4.5:1 for text. Add a tabindex strategy and visible focus styles.",
    tags: ["a11y", "quality"],
  },
  {
    id: "schema-org-injector",
    name: "Schema.org Injector",
    description:
      "Adds JSON-LD structured data appropriate to the page content (Article, Product, FAQ, BreadcrumbList, etc.)",
    icon: "data_object",
    prompt:
      "Detect the page type and inject a JSON-LD <script type='application/ld+json'> block using schema.org vocabulary. Pick the most specific type (Article, Product, FAQPage, BreadcrumbList, Organization, etc.). Fill as many fields as can be inferred.",
    tags: ["seo", "structured-data"],
  },
  {
    id: "i18n-extractor",
    name: "i18n Extractor",
    description:
      "Extracts visible strings into a key-based dictionary and substitutes with data-i18n attributes + a tiny JS lookup.",
    icon: "translate",
    prompt:
      "Extract every visible user-facing string into a dictionary object in a <script> tag, and replace the inline text with <span data-i18n='key'></span>. Add a tiny i18n.apply(locale) function that walks [data-i18n] and sets textContent from the dictionary. Provide at least the original language as the default bundle.",
    tags: ["i18n", "localization"],
  },
  {
    id: "performance-optimizer",
    name: "Performance Optimizer",
    description:
      "Defers non-critical JS, lazy-loads images, inlines critical CSS, avoids layout thrash.",
    icon: "speed",
    prompt:
      "Optimize for first-paint and TTI: defer or async non-critical <script> tags, add loading='lazy' to below-the-fold images, inline critical CSS in a <style> block, use font-display: swap, and avoid forced layout shifts by reserving aspect-ratio on images and iframes.",
    tags: ["performance", "quality"],
  },
  {
    id: "responsive-designer",
    name: "Mobile-First Responsive",
    description:
      "Forces mobile-first CSS, container queries where useful, and a tested mobile/tablet/desktop layout.",
    icon: "smartphone",
    prompt:
      "Design mobile-first. Use Tailwind's sm:/md:/lg: breakpoints (or CSS media queries) to layer on enhancements. Test mentally at 360px, 768px, 1280px. Avoid horizontal scroll. Use clamp() for fluid type and spacing where appropriate.",
    tags: ["responsive", "design"],
  },
  {
    id: "dark-mode-injector",
    name: "Dark Mode Injector",
    description:
      "Adds a class-toggled dark mode with persistence and a toggle button.",
    icon: "dark_mode",
    prompt:
      "Implement a dark mode. Use Tailwind's 'dark:' variant (with class strategy) or CSS custom properties. Provide a visible toggle button (top-right), persist the user's choice in localStorage, and respect prefers-color-scheme on first visit.",
    tags: ["design", "theme"],
  },
  {
    id: "form-validator",
    name: "Form Validator",
    description:
      "Adds client-side validation with accessible error messages.",
    icon: "rule",
    prompt:
      "For every form, add client-side validation. Show inline error messages linked via aria-describedby, set aria-invalid on failed fields, focus the first invalid field on submit, and prevent submission until valid. Do not rely on alert().",
    tags: ["forms", "a11y"],
  },
  {
    id: "api-mock-injector",
    name: "API Mock Injector",
    description:
      "When the page needs data, mocks a fetch() with a realistic JSON payload matching the requested shape.",
    icon: "cloud",
    prompt:
      "If the page requires backend data, do not call a real API. Instead, intercept fetch() with a small mock that returns realistic JSON matching the requested shape, and render the UI from that mock. Make the mock data comprehensive enough to demonstrate edge cases (empty, error, long list).",
    tags: ["data", "mock"],
  },
];

const customSkills = new Map(); // id -> skill

export function listSkills() {
  // Merge builtins with custom (custom overrides builtins with same id)
  const out = [];
  for (const s of BUILTIN_SKILLS) {
    if (customSkills.has(s.id)) out.push(customSkills.get(s.id));
    else out.push(s);
  }
  for (const [id, s] of customSkills.entries()) {
    if (!BUILTIN_SKILLS.find((b) => b.id === id)) out.push(s);
  }
  return out;
}

export function getSkill(id) {
  return customSkills.get(id) || BUILTIN_SKILLS.find((s) => s.id === id);
}

export function registerSkill(skill) {
  if (!skill?.id) throw new Error("skill.id is required");
  customSkills.set(skill.id, skill);
  return skill;
}

export function unregisterSkill(id) {
  return customSkills.delete(id);
}

// Load SKILLS_CONFIG env (JSON array) on startup
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

// Build the system-prompt fragment to inject when a set of skills is active.
export function buildSkillsPrompt(activeSkillIds) {
  if (!activeSkillIds || activeSkillIds.length === 0) return "";
  const lines = ["\n\nACTIVE_SKILLS: Apply each of these skill directives when producing the HTML."];
  for (const id of activeSkillIds) {
    const skill = getSkill(id);
    if (!skill) continue;
    lines.push(`\n--- Skill: ${skill.name} (${skill.id}) ---\n${skill.prompt}`);
  }
  return lines.join("\n");
}
