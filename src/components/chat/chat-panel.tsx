import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  TbSend,
  TbSquare,
  TbPlus,
  TbCopy,
  TbCheck,
  TbLoader2,
  TbSparkles,
  TbTool,
} from "react-icons/tb";
import { useChatStore, ChatMessage } from "../../store/chatStore";
import { useProvidersStore } from "../../store/providersStore";
import { useMcpStore } from "../../store/mcpStore";
import { useSkillsStore } from "../../store/skillsStore";

interface ChatPanelProps {
  html: string;
  setHtml: (s: string) => void;
  previousPrompt: string;
  setPreviousPrompt: (s: string) => void;
  templateId: string;
  language: string;
  maxTokens: number;
  temperature: number;
  onStreamingUpdate: (html: string) => void; // live updates during stream
  pendingClone: { url: string } | null;
  clearPendingClone: () => void;
}

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatPanel(props: ChatPanelProps) {
  const { t } = useTranslation();
  const {
    messages,
    isWorking,
    addMessage,
    appendToMessage,
    setWorking,
    clear,
  } = useChatStore();
  const { providers, current, configs } = useProvidersStore();
  const { enabledTools } = useMcpStore();
  const { active: activeSkills } = useSkillsStore();
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // If a clone request is pending, kick it off automatically
  useEffect(() => {
    if (props.pendingClone) {
      runClone(props.pendingClone.url);
      props.clearPendingClone();
    }
  }, [props.pendingClone]);

  const provider = providers.find((p: any) => p.id === current);
  const cfg = configs[current] || { apiKey: "", baseUrl: "", model: "" };
  const activeSkillCount = activeSkills.length;
  const activeToolCount = enabledTools.length;

  const send = async () => {
    if (isWorking || !input.trim()) return;
    const text = input.trim();
    setInput("");
    await runChat(text);
  };

  const runChat = async (prompt: string) => {
    const controller = new AbortController();
    setWorking(true, controller);
    const userMsg: ChatMessage = {
      id: genId(),
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    const assistantId = genId();
    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    });

    let contentResponse = "";
    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          ...(props.html ? { html: props.html } : {}),
          ...(props.previousPrompt ? { previousPrompt: props.previousPrompt } : {}),
          templateId: props.templateId,
          language: props.language,
          provider_id: current,
          api_key: cfg.apiKey,
          base_url: cfg.baseUrl,
          model: cfg.model,
          skills: activeSkills,
          mcp_tools: enabledTools,
          max_tokens: props.maxTokens,
          temperature: props.temperature,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || t("errors.aiRequestFailed"));
        setWorking(false, null);
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder("utf-8");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Detect MCP tool events
        const mcpMatch = chunk.match(/<!--mcp:(\{[\s\S]*?\})-->/);
        if (mcpMatch) {
          try {
            const info = JSON.parse(mcpMatch[1]);
            addMessage({
              id: genId(),
              role: "assistant",
              content: "",
              timestamp: Date.now(),
              isToolEvent: true,
              toolName: info.tool,
              toolServer: info.server,
            });
          } catch {}
          // strip out the marker so it doesn't go into HTML
          const cleaned = chunk.replace(/<!--mcp:\{[\s\S]*?\}-->/g, "");
          contentResponse += cleaned;
          appendToMessage(assistantId, cleaned);
          continue;
        }
        // Strip error markers
        const errMatch = chunk.match(/^\[error\] (.+)$/m);
        if (errMatch) {
          toast.error(errMatch[1]);
          continue;
        }
        contentResponse += chunk;
        appendToMessage(assistantId, chunk);
        // Live-update preview
        const finalDoc = contentResponse.match(/<!DOCTYPE html>[\s\S]*<\/html>/)?.[0];
        if (finalDoc) {
          props.onStreamingUpdate(finalDoc);
        }
      }
      // Try to extract the final HTML
      const finalDoc = contentResponse.match(/<!DOCTYPE html>[\s\S]*<\/html>/)?.[0];
      if (finalDoc) {
        props.setHtml(finalDoc);
        // Update the assistant message to embed the HTML
        useChatStore.setState((state: any) => ({
          messages: state.messages.map((m: any) =>
            m.id === assistantId ? { ...m, html: finalDoc } : m
          ),
        }));
      } else if (contentResponse.includes("<html") && contentResponse.includes("<body")) {
        let fixed = contentResponse;
        if (!fixed.includes("</body>")) fixed += "\n</body>";
        if (!fixed.includes("</html>")) fixed += "\n</html>";
        props.setHtml(fixed);
      }
      props.setPreviousPrompt(prompt);
    } catch (e: any) {
      if (e.name === "AbortError") {
        toast.info("Stopped");
      } else {
        toast.error(e.message || t("errors.aiRequestFailed"));
      }
    } finally {
      setWorking(false, null);
    }
  };

  const runClone = async (url: string) => {
    const controller = new AbortController();
    setWorking(true, controller);
    const userMsg: ChatMessage = {
      id: genId(),
      role: "user",
      content: `🌐 Clone: ${url}`,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    const assistantId = genId();
    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    });

    let contentResponse = "";
    try {
      const res = await fetch("/api/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          provider_id: current,
          api_key: cfg.apiKey,
          base_url: cfg.baseUrl,
          model: cfg.model,
          skills: activeSkills,
          mcp_tools: enabledTools,
          max_tokens: props.maxTokens,
          temperature: props.temperature,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || t("cloner.fetchFailed"));
        setWorking(false, null);
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder("utf-8");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const cleaned = chunk.replace(/<!--mcp:\{[\s\S]*?\}-->/g, "");
        contentResponse += cleaned;
        appendToMessage(assistantId, cleaned);
        const finalDoc = contentResponse.match(/<!DOCTYPE html>[\s\S]*<\/html>/)?.[0];
        if (finalDoc) props.onStreamingUpdate(finalDoc);
      }
      const finalDoc = contentResponse.match(/<!DOCTYPE html>[\s\S]*<\/html>/)?.[0];
      if (finalDoc) {
        props.setHtml(finalDoc);
        useChatStore.setState((state: any) => ({
          messages: state.messages.map((m: any) =>
            m.id === assistantId ? { ...m, html: finalDoc } : m
          ),
        }));
      }
    } catch (e: any) {
      toast.error(e.message || t("cloner.fetchFailed"));
    } finally {
      setWorking(false, null);
    }
  };

  const stop = () => {
    if (useChatStore.getState().abortController) {
      useChatStore.getState().abortController!.abort();
    }
    setWorking(false, null);
  };

  const newChat = () => {
    if (isWorking) {
      toast.warn(t("askAI.working"));
      return;
    }
    clear();
    props.setPreviousPrompt("");
  };

  const copyMsg = (m: ChatMessage) => {
    const text = m.html || m.content;
    navigator.clipboard.writeText(text);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-l border-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2d30]">
        <div className="flex items-center gap-2 text-white text-sm font-medium">
          <TbSparkles size={18} className="text-indigo-400" />
          {t("askAI.title")}
        </div>
        <button
          onClick={newChat}
          className="flex items-center gap-1 text-xs text-[#9a9a9a] hover:text-white bg-[#2d2d2d] hover:bg-[#3c3c3c] px-2 py-1 rounded"
        >
          <TbPlus size={14} />
          {t("chat.newChat")}
        </button>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 px-4 py-2 text-[11px] text-[#9a9a9a] border-b border-[#2d2d30]">
        <span className="px-2 py-0.5 rounded bg-[#2d2d2d] border border-[#3c3c3c]">
          {provider?.name || "..."} · {cfg.model || "?"}
        </span>
        {activeSkillCount > 0 && (
          <span className="px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-700/50">
            {activeSkillCount} {t("chat.skills")}
          </span>
        )}
        {activeToolCount > 0 && (
          <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
            <TbTool size={11} /> {activeToolCount} {t("chat.tools")}
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-[#7a7a7a] mt-12 px-4">
            <TbSparkles size={32} className="mx-auto mb-3 text-indigo-400" />
            <div className="text-sm">{t("askAI.placeholder")}</div>
          </div>
        )}
        {messages.map((m: ChatMessage) => {
          if (m.isToolEvent) {
            return (
              <div key={m.id} className="animate-fade-in-up">
                <div className="tool-chip">
                  <TbTool size={12} />
                  <span className="text-emerald-300">{m.toolServer}</span>
                  <span className="text-[#8a8a8a]">/</span>
                  <span className="text-white">{m.toolName}</span>
                </div>
              </div>
            );
          }
          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end animate-fade-in-up">
                <div className="chat-bubble chat-bubble-user">{m.content}</div>
              </div>
            );
          }
          // assistant message: show a short preview (truncated), with copy + view
          const preview = (m.html || m.content || "").replace(/<[^>]+>/g, "").slice(0, 200);
          return (
            <div key={m.id} className="flex flex-col items-start gap-1 animate-fade-in-up">
              <div
                className={`chat-bubble chat-bubble-assistant ${isWorking && m.id === messages[messages.length - 1]?.id ? "chat-cursor" : ""}`}
              >
                {preview || (isWorking ? "" : "(empty)")}
                {m.html && (
                  <button
                    onClick={() => copyMsg(m)}
                    className="absolute -bottom-3 right-2 text-[#9a9a9a] hover:text-white text-xs flex items-center gap-1 bg-[#252526] border border-[#3c3c3c] rounded-full px-2 py-0.5"
                  >
                    {copiedId === m.id ? <TbCheck size={11} /> : <TbCopy size={11} />}
                    {copiedId === m.id ? t("chat.copied") : t("chat.copy")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input area */}
      <div className="border-t border-[#2d2d30] p-3">
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg focus-within:border-indigo-500">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t("chat.placeholder")}
            rows={3}
            className="w-full bg-transparent text-white text-sm px-3 py-2 resize-none focus:outline-none"
            disabled={isWorking}
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="text-[11px] text-[#7a7a7a]">
              {provider?.name} · {cfg.model || "?"}
            </div>
            {isWorking ? (
              <button
                onClick={stop}
                className="flex items-center gap-1 text-sm bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg"
              >
                <TbSquare size={14} />
                {t("chat.stop")}
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!input.trim()}
                className="flex items-center gap-1 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg"
              >
                {input.trim() ? <TbSend size={14} /> : <TbLoader2 size={14} />}
                {t("chat.send")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
