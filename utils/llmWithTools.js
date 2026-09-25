// LLM tool-use loop.
// Orchestrates: send messages to LLM -> if model asks for tools, call them
// via the MCP registry, append tool_result messages, then re-send.
// Returns a streaming ReadableStream of text deltas (OpenAI-compatible
// SSE-flavoured chunks so the existing front-end continues to work).

import { callMcpTool, listAllTools } from "./mcp.js";
import { getAdapter } from "./llmAdapters.js";

const MAX_TOOL_ITERATIONS = 6;

// Convert MCP tools into the OpenAI tool-call schema accepted by most providers
export async function buildToolDefinitions(enabledToolIds) {
  if (!enabledToolIds || enabledToolIds.length === 0) return [];
  const all = await listAllTools();
  const wanted = all.filter((t) => {
    const key = `${t.server}/${t.name}`;
    return enabledToolIds.includes(key);
  });
  return wanted.map((t) => ({
    type: "function",
    function: {
      name: `${t.server}__${t.name}`.replace(/[^a-zA-Z0-9_]/g, "_"),
      description: t.description || `MCP tool: ${t.server}/${t.name}`,
      parameters: t.input_schema || { type: "object", properties: {} },
    },
    _mcp: { server: t.server, name: t.name }, // private marker
  }));
}

// Convert provider-specific tool_call deltas into a unified list of pending
// tool calls. For simplicity we accumulate per-call JSON argument strings
// into a map keyed by index, and treat them as "ready" on the next non-tool
// chunk (or at done).
function accumulateToolCalls(state, deltas) {
  if (!state.toolCalls) state.toolCalls = [];
  for (const d of deltas) {
    if (d.type === "tool_call_start") {
      state.toolCalls.push({
        id: d.content.id,
        name: d.content.name,
        args_json: "",
      });
    } else if (d.type === "tool_call_delta") {
      const last = state.toolCalls[state.toolCalls.length - 1];
      if (last) last.args_json += d.content || "";
    } else if (d.type === "tool_call") {
      const idx = d.content.index ?? state.toolCalls.length;
      state.toolCalls[idx] = state.toolCalls[idx] || {
        id: d.content.id || `call_${idx}`,
        name: "",
        args_json: "",
      };
      state.toolCalls[idx].id = state.toolCalls[idx].id || d.content.id;
      state.toolCalls[idx].name = d.content.function?.name || d.content.name || state.toolCalls[idx].name;
      if (d.content.function?.arguments) {
        state.toolCalls[idx].args_json += d.content.function.arguments;
      }
    }
  }
}

// Main entry. Returns an async generator yielding { type, content } items
// that the caller can pipe to the SSE response.
export async function* runWithTools({
  unified, // { model, messages, max_tokens, temperature, tools, stream }
  provider, // PROVIDERS entry
  apiKey,
  baseUrl,
  enabledTools, // array of "serverId/toolName" strings
  maxIterations = MAX_TOOL_ITERATIONS,
}) {
  const adapter = getAdapter(provider.format);
  const ctx = { provider, apiKey, baseUrl };
  const tools = await buildToolDefinitions(enabledTools);
  const messages = [...unified.messages];

  for (let iter = 0; iter < maxIterations; iter++) {
    const request = adapter.buildRequest(
      { ...unified, messages, tools: tools.length ? tools : undefined, stream: true },
      ctx
    );
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    if (!response.ok) {
      const text = await response.text();
      yield {
        type: "error",
        content: `LLM error ${response.status}: ${text.slice(0, 500)}`,
      };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    const state = { toolCalls: [] };
    let sawToolCall = false;

    let buffer = "";
    while (true) {
      const { done, value } = reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const events = adapter.parseSSEChunk(line + "\n", state);
        for (const ev of events) {
          if (ev.type === "text") {
            yield { type: "text", content: ev.content };
          } else if (ev.type === "tool_call") {
            sawToolCall = true;
            accumulateToolCalls(state, [ev]);
          } else if (ev.type === "tool_call_start" || ev.type === "tool_call_delta") {
            sawToolCall = true;
            accumulateToolCalls(state, [ev]);
          }
        }
      }
    }
    // Process any leftover
    if (buffer.trim()) {
      const events = adapter.parseSSEChunk(buffer + "\n", state);
      for (const ev of events) {
        if (ev.type === "text") yield { type: "text", content: ev.content };
        if (ev.type === "tool_call" || ev.type === "tool_call_start" || ev.type === "tool_call_delta") {
          sawToolCall = true;
          accumulateToolCalls(state, [ev]);
        }
      }
    }

    if (!sawToolCall || !state.toolCalls.length) {
      // Done, model produced text without tool calls
      return;
    }

    // Append the assistant's tool-call message in OpenAI format
    const assistantToolMsg = {
      role: "assistant",
      content: null,
      tool_calls: state.toolCalls.map((tc, idx) => ({
        id: tc.id || `call_${idx}`,
        type: "function",
        function: {
          name: tc.name,
          arguments: tc.args_json || "{}",
        },
      })),
    };
    messages.push(assistantToolMsg);

    // Execute each tool call via MCP and append the tool messages
    for (const tc of state.toolCalls) {
      // Find the matching tool definition to get server + name
      const toolDef = tools.find(
        (t) => t.function.name === tc.name || tc.name === t._mcp.server + "__" + t._mcp.name
      );
      if (!toolDef) {
        messages.push({
          role: "tool",
          tool_call_id: tc.id || "",
          content: `Tool ${tc.name} not found`,
        });
        continue;
      }
      const { server, name } = toolDef._mcp;
      let args = {};
      try {
        args = tc.args_json ? JSON.parse(tc.args_json) : {};
      } catch {
        args = {};
      }
      yield {
        type: "tool_event",
        content: { server, tool: name, args, started: true },
      };
      try {
        const result = await callMcpTool(server, name, args);
        const text = (result?.content || [])
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n");
        messages.push({
          role: "tool",
          tool_call_id: tc.id || "",
          content: text || "(empty tool result)",
        });
        yield {
          type: "tool_event",
          content: { server, tool: name, finished: true, result: text },
        };
      } catch (e) {
        messages.push({
          role: "tool",
          tool_call_id: tc.id || "",
          content: `Tool error: ${e.message}`,
        });
        yield {
          type: "tool_event",
          content: { server, tool: name, finished: true, error: e.message },
        };
      }
    }
    // Loop continues: re-send messages with tool results attached.
  }

  yield {
    type: "error",
    content: `Reached max tool iterations (${maxIterations}). Stopping.`,
  };
}
