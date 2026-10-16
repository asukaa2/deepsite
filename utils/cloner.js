// Website Cloner utility.
// Given a target URL, fetch the page, extract a clean DOM (HTML + critical
// inline CSS), and produce a "skeleton" prompt for the LLM to recreate the
// page from scratch in a single HTML file.

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
];

async function fetchWithTimeout(url, opts = {}, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      redirect: "follow",
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

// Resolve a possibly-relative URL against the page URL
function resolveUrl(u, base) {
  try {
    return new URL(u, base).toString();
  } catch {
    return u;
  }
}

// Strip tags we don't want to keep when re-creating the page
function pruneDom(doc) {
  const drop = doc.querySelectorAll(
    [
      "script",
      "noscript",
      "iframe",
      "object",
      "embed",
      "svg", // svgs get re-created from scratch
      "link[rel='stylesheet']",
      "link[rel='preload']",
      "link[rel='prefetch']",
      "link[rel='preconnect']",
      "link[rel='dns-prefetch']",
      "meta[http-equiv='Content-Security-Policy']",
      "meta[name='referrer']",
      "style[type='text/css']", // keep only <style> with no type (inline critical css)
      "template",
      "picture > source",
      "form",
    ].join(",")
  );
  drop.forEach((n) => n.remove());

  // Remove all inline event handlers
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
    }
  });
}

// Collect the page's visible text + structure
function extractDomOutline(doc, baseUrl) {
  const result = {
    title: doc.querySelector("title")?.textContent?.trim() || "",
    meta_description:
      doc.querySelector("meta[name='description']")?.getAttribute("content") || "",
    lang: doc.documentElement.getAttribute("lang") || "",
    body_classes: doc.body?.className || "",
    sections: [],
    colors: new Set(),
    fonts: new Set(),
    images: [],
    links: [],
  };

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, {
    acceptNode(n) {
      const tag = n.tagName.toLowerCase();
      // Skip script/style/noscript and obvious noise
      if (["script", "style", "noscript", "svg", "iframe"].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const visited = new Set();
  let node;
  while ((node = walker.nextNode())) {
    if (visited.has(node)) continue;
    visited.add(node);

    const tag = node.tagName.toLowerCase();
    const cs = (() => {
      try {
        return node.ownerDocument?.defaultView?.getComputedStyle(node);
      } catch {
        return null;
      }
    })();

    const section = {
      tag,
      id: node.id || undefined,
      class: node.className?.toString?.() || undefined,
      role: node.getAttribute("role") || undefined,
      text: (node.textContent || "").trim().slice(0, 500),
    };

    if (tag === "img") {
      const src = node.getAttribute("src") || node.getAttribute("data-src");
      if (src) {
        const abs = resolveUrl(src, baseUrl);
        section.img = { src: abs, alt: node.alt || "" };
        result.images.push(abs);
      }
    }
    if (tag === "a") {
      const href = node.getAttribute("href");
      if (href) result.links.push(resolveUrl(href, baseUrl));
    }
    if (cs) {
      const bg = cs.getPropertyValue("background-color");
      const color = cs.getPropertyValue("color");
      const ff = cs.getPropertyValue("font-family");
      if (bg && bg !== "rgba(0, 0, 0, 0)") result.colors.add(bg);
      if (color) result.colors.add(color);
      if (ff) result.fonts.add(ff.split(",")[0].trim());
    }

    // Only push meaningful nodes (have text or are structural)
    if (section.text.length > 1 || ["header", "nav", "main", "section", "article", "footer", "aside", "form", "button", "h1", "h2", "h3", "img", "a"].includes(tag)) {
      result.sections.push(section);
    }
  }

  result.colors = [...result.colors];
  result.fonts = [...result.fonts];
  return result;
}

// Main entry: clone a URL into an LLM-friendly prompt + raw html snapshot.
export async function cloneWebsite(url) {
  if (!url) throw new Error("URL is required");
  let target;
  try {
    target = new URL(url).toString();
  } catch {
    // try to prepend https://
    target = "https://" + url;
  }

  // Fetch
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  let res;
  try {
    res = await fetchWithTimeout(
      target,
      {
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      },
      25000
    );
  } catch (e) {
    throw new Error(`Failed to fetch ${target}: ${e.message}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${target}`);

  const html = await res.text();
  const finalUrl = res.url || target;
  const contentType = res.headers.get("content-type") || "";

  // Parse using a tiny HTML extractor (no DOMParser available on Node)
  const outline = parseHtmlAndExtract(html, finalUrl);

  return {
    url: finalUrl,
    title: outline.title,
    meta_description: outline.meta_description,
    lang: outline.lang,
    body_classes: outline.body_classes,
    sections: outline.sections.slice(0, 200), // cap
    colors: outline.colors,
    fonts: outline.fonts,
    images: outline.images.slice(0, 30),
    links: outline.links.slice(0, 30),
    raw_html_preview: html.slice(0, 8000),
    content_type: contentType,
  };
}

// Lightweight HTML parser using regex + a tiny DOM shim.
// This avoids pulling in jsdom (heavy). It extracts enough structure for the
// LLM to recreate the page.
function parseHtmlAndExtract(html, baseUrl) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const metaMatch = html.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
  );
  const meta_description = metaMatch ? metaMatch[1].trim() : "";

  const langMatch = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
  const lang = langMatch ? langMatch[1] : "";

  const bodyClassMatch = html.match(/<body[^>]*\sclass=["']([^"']*)["']/i);
  const body_classes = bodyClassMatch ? bodyClassMatch[1] : "";

  // Extract the body inner HTML
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;

  // Strip everything we don't want
  const cleaned = bodyHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<template[\s\S]*?<\/template>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\son\w+=["'][^"']*["']/gi, "");

  // Extract colors from inline styles
  const colors = new Set();
  const colorRe = /(?:color|background-color|background|border-color)\s*:\s*([^;"'\s]+)/gi;
  let m;
  while ((m = colorRe.exec(cleaned))) {
    colors.add(m[1]);
  }
  // Limit
  const colorList = [...colors].slice(0, 20);

  // Extract images
  const images = [];
  const imgRe = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
  while ((m = imgRe.exec(cleaned))) {
    const altMatch = m[0].match(/\salt=["']([^"']*)["']/i);
    images.push({
      src: resolveUrl(m[1], baseUrl),
      alt: altMatch ? altMatch[1] : "",
    });
    if (images.length >= 30) break;
  }

  // Extract links
  const links = [];
  const linkRe = /<a[^>]*\shref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = linkRe.exec(cleaned))) {
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    links.push({ href: resolveUrl(m[1], baseUrl), text: text.slice(0, 80) });
    if (links.length >= 30) break;
  }

  // Extract a flat list of meaningful elements (heading hierarchy + first-level sections)
  const sections = [];
  const tagRe = /<(h[1-6]|p|nav|header|footer|main|section|article|aside|button|ul|ol|li|form|img|a|div)[^>]*>([\s\S]*?)<\/\1>/gi;
  while ((m = tagRe.exec(cleaned)) && sections.length < 200) {
    const tag = m[1].toLowerCase();
    const attrs = m[0].slice(0, m[0].indexOf(">") + 1);
    const clsMatch = attrs.match(/\sclass=["']([^"']*)["']/i);
    const idMatch = attrs.match(/\sid=["']([^"']*)["']/i);
    const inner = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!inner && !["img", "nav", "header", "footer", "main", "section"].includes(tag)) continue;
    if (inner.length > 600) continue;
    sections.push({
      tag,
      id: idMatch ? idMatch[1] : undefined,
      class: clsMatch ? clsMatch[1] : undefined,
      text: inner,
    });
  }

  // Extract visible body text (truncated) for context
  const text = cleaned
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);

  return {
    title,
    meta_description,
    lang,
    body_classes,
    sections,
    colors: colorList,
    fonts: [], // not detectable without a real DOM
    images,
    links,
    text,
  };
}

// Build the system + user prompt pair used by the /api/clone endpoint to
// instruct the LLM to recreate the page from the cloned outline.
export function buildClonerPrompts(cloneData) {
  const systemPrompt = `You are a website cloner. You will be given a structured outline of an existing web page (title, headings, sections, links, images, color palette, fonts, visible text). Recreate the page as a SINGLE self-contained HTML file using TailwindCSS via <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>. 
Rules:
- Match the visual hierarchy and structure as closely as possible.
- Use the same color palette and fonts when provided.
- Use real text content from the outline; do not invent unrelated text.
- Replace external image src with the provided URLs verbatim.
- Strip any tracking, ads, popups, cookie banners.
- Make the page responsive and accessible (semantic HTML, alt text, focus states).
- If the outline is incomplete, infer the most likely layout.
- Output ONLY the HTML file, no explanation.`;

  const userPrompt = `Recreate this page:\n\nURL: ${cloneData.url}\nTitle: ${cloneData.title}\nDescription: ${cloneData.meta_description}\nLang: ${cloneData.lang}\nBody classes: ${cloneData.body_classes}\n\nColor palette: ${JSON.stringify(cloneData.colors)}\nFonts: ${JSON.stringify(cloneData.fonts)}\n\nSections (first ${cloneData.sections.length}):\n${JSON.stringify(cloneData.sections, null, 2)}\n\nImages (first ${cloneData.images.length}):\n${JSON.stringify(cloneData.images, null, 2)}\n\nLinks (first ${cloneData.links.length}):\n${JSON.stringify(cloneData.links, null, 2)}\n\nVisible text (truncated):\n${cloneData.text || ""}\n`;

  return { systemPrompt, userPrompt };
}
