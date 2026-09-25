// Provider adapters.
// Each adapter converts a unified request shape into the format required by
// the upstream provider's chat/streaming endpoint, and converts the upstream
// streaming response back into OpenAI-compatible SSE chunks.
//
// Unified request:
//   {
//     model, messages: [{role, content}], stream: bool,
//     max_tokens, temperature, tools, system
//   }
//
// Each adapter exports:
//   buildRequest(unified) -> { url, headers, body, method }
//   parseSSEChunk(chunk, state) -> [{ type: 'text'|'tool_call'|'done', content }]
//   parseNonStream(json) -> string (text content)

// ---- OpenAI / DeepSeek / Mistral / Groq / OpenRouter / etc. ----
const openaiAdapter = {
  buildRequest(unified, ctx) {
    const { baseUrl, apiKey, provider } = ctx;
    const headers = {
      "Content-Type": "application/json",
    };
    headers[provider.auth_header] =
      provider.auth_prefix + (apiKey || "");
    return {
      url: `${baseUrl.replace(/\/$/, "")}/chat/completions`,
      method: "POST",
      headers,
      body: JSON.stringify({
        model: unified.model,
        messages: unified.messages,
        stream: unified.stream,
        max_tokens: unified.max_tokens,
        temperature: unified.temperature,
        tools: unified.tools,
      }),
    };
  },
  parseSSEChunk(chunk, _state) {
    // chunk is one or more SSE lines
    const out = [];
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        out.push({ type: "done" });
        continue;
      }
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta;
        if (delta?.content) {
          out.push({ type: "text", content: delta.content });
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            out.push({ type: "tool_call", content: tc });
          }
        }
      } catch {}
    }
    return out;
  },
  parseNonStream(json) {
    return json.choices?.[0]?.message?.content || "";
  },
};

// ---- Anthropic Claude ----
const anthropicAdapter = {
  buildRequest(unified, ctx) {
    const { baseUrl, apiKey, provider } = ctx;
    // Anthropic requires anthropic-version header
    const headers = {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    };
    headers[provider.auth_header] = provider.auth_prefix + (apiKey || "");

    // Split system vs conversation
    const systemMsgs = unified.messages.filter((m) => m.role === "system");
    const convMsgs = unified.messages.filter((m) => m.role !== "system");
    const systemText = systemMsgs.map((m) => m.content).join("\n\n");

    // Anthropic alternates user/assistant; we may need to merge consecutive
    const merged = [];
    for (const m of convMsgs) {
      const last = merged[merged.length - 1];
      if (last && last.role === m.role) {
        last.content += "\n\n" + m.content;
      } else {
        merged.push({ role: m.role, content: m.content });
      }
    }

    const body = {
      model: unified.model,
      messages: merged,
      max_tokens: unified.max_tokens,
      temperature: unified.temperature,
      stream: unified.stream,
    };
    if (systemText) body.system = systemText;
    if (unified.tools) {
      body.tools = unified.tools.map((t) => ({
        name: t.function?.name || t.name,
        description: t.function?.description || t.description,
        input_schema: t.function?.parameters || t.input_schema || {},
      }));
    }

    return {
      url: `${baseUrl.replace(/\/$/, "")}/messages`,
      method: "POST",
      headers,
      body: JSON.stringify(body),
    };
  },
  parseSSEChunk(chunk, state) {
    // Anthropic SSE has event: ... + data: ... pairs
    const out = [];
    const lines = chunk.split("\n");
    let currentEvent = null;
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
        continue;
      }
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
          out.push({ type: "text", content: json.delta.text });
        } else if (json.type === "content_block_delta" && json.delta?.type === "input_json_delta") {
          out.push({ type: "tool_call_delta", content: json.delta.partial_json });
        } else if (json.type === "message_stop") {
          out.push({ type: "done" });
        } else if (json.type === "content_block_start" && json.content_block?.type === "tool_use") {
          out.push({
            type: "tool_call_start",
            content: {
              id: json.content_block.id,
              name: json.content_block.name,
            },
          });
        }
      } catch {}
    }
    return out;
  },
  parseNonStream(json) {
    return (json.content || [])
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");
  },
};

// ---- Google Gemini ----
const geminiAdapter = {
  buildRequest(unified, ctx) {
    const { baseUrl, apiKey, provider } = ctx;
    const headers = {
      "Content-Type": "application/json",
    };
    headers[provider.auth_header] = provider.auth_prefix + (apiKey || "");

    // Convert messages
    const systemParts = unified.messages
      .filter((m) => m.role === "system")
      .map((m) => ({ text: m.content }));
    const conv = unified.messages.filter((m) => m.role !== "system");

    const contents = conv.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body = {
      contents,
      generationConfig: {
        maxOutputTokens: unified.max_tokens,
        temperature: unified.temperature,
      },
    };
    if (systemParts.length) {
      body.systemInstruction = { parts: systemParts };
    }

    const method = unified.stream ? "streamGenerateContent" : "generateContent";
    const url = `${baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(unified.model)}:${method}?alt=sse`;

    return {
      url,
      method: "POST",
      headers,
      body: JSON.stringify(body),
    };
  },
  parseSSEChunk(chunk, _state) {
    const out = [];
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        const parts = json.candidates?.[0]?.content?.parts || [];
        for (const p of parts) {
          if (p.text) out.push({ type: "text", content: p.text });
          if (p.functionCall) {
            out.push({
              type: "tool_call",
              content: {
                id: Math.random().toString(36).slice(2),
                name: p.functionCall.name,
                arguments: JSON.stringify(p.functionCall.args || {}),
              },
            });
          }
        }
      } catch {}
    }
    return out;
  },
  parseNonStream(json) {
    const parts = json.candidates?.[0]?.content?.parts || [];
    return parts.map((p) => p.text || "").join("");
  },
};

export const ADAPTERS = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
};

export function getAdapter(format) {
  return ADAPTERS[format] || ADAPTERS.openai;
}
