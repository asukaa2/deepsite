import { useEffect, useRef, useState, useMemo } from "react";
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
  TbBolt,
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
  onStreamingUpdate: (html: string) => void;
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
  const { skills, active: activeSkills, toggle } = useSkillsStore();
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  // Build slash menu items — active skills + available skills + special commands
  const slashItems = useMemo(() => {
    const items: { id: string; name: string; desc: string; cmd: string }[] = [];
    for (const s of skills) {
      items.push({
        id: s.id,
        name: s.name,
        desc: s.description,
        cmd: `/${s.id}`,
      });
    }
    items.push({
      id: "__clone",
      name: "Clone Website",
      desc: "Switch to clone mode and enter a URL",
      cmd: "/clone",
    });
    items.push({
      id: "__clear",
      name: "Clear Chat",
      desc: "Reset conversation history",
      cmd: "/clear",
    });
    return items;
  }, [skills]);

  // Detect `/` at start of input → open menu
  useEffect(() => {
    const v = input.trim();
    if (v.startsWith("/") && !v.includes(" ") && v.length <= 32) {
      setSlashOpen(true);
      setSlashIndex(0);
    } else {
      setSlashOpen(false);
    }
  }, [input]);

  const filteredSlash = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q.startsWith("/")) return slashItems;
    return slashItems.filter(
      (i) =>
        i.id.toLowerCase().includes(q.slice(1)) ||
        i.name.toLowerCase().includes(q.slice(1))
    );
  }, [input, slashItems]);

  const applySlash = (item: (typeof slashItems)[number]) => {
    if (item.id === "__clear") {
      clear();
      props.setPreviousPrompt("");
      setInput("");
      setSlashOpen(false);
      return;
    }
    if (item.id === "__clone") {
      setInput("/clone ");
      setSlashOpen(false);
      return;
    }
    // Activate the skill if not already active
    if (!activeSkills.includes(item.id)) toggle(item.id);
    toast.success(`Skill active: ${item.name}`);
    setInput("");
    setSlashOpen(false);
    inputRef.current?.focus();
  };

  const send = async () => {
    if (isWorking || !input.trim()) return;
    const text = input.trim();
    setInput("");
    setSlashOpen(false);

    // Handle special /clone command
    if (text.startsWith("/clone ")) {
      const url = text.slice("/clone ".length).trim();
      if (url) {
        runClone(url);
        return;
      }
    }
    if (text === "/clear") {
      clear();
      props.setPreviousPrompt("");
      return;
    }

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
          const cleaned = chunk.replace(/<!--mcp:\{[\s\S]*?\}-->/g, "");
          contentResponse += cleaned;
          appendToMessage(assistantId, cleaned);
          continue;
        }
        const errMatch = chunk.match(/^\[error\] (.+)$/m);
        if (errMatch) {
          toast.error(errMatch[1]);
          continue;
        }
        contentResponse += chunk;
        appendToMessage(assistantId, chunk);
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
      } else if (contentResponse.includes("<html") && contentResponse.includes("<body")) {
        let fixed = contentResponse;
        if (!fixed.includes("</body>")) fixed += "\n</body>";
        if (!fixed.includes("</html>")) fixed += "\n</html>";
        props.setHtml(fixed);
      }
      props.setPreviousPrompt(prompt);
    } catch (e: any) {
      if (e.name === "AbortError") toast.info("Stopped");
      else toast.error(e.message || t("errors.aiRequestFailed"));
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
      content: `Clone: ${url}`,
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

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen && filteredSlash.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((i) => (i + 1) % filteredSlash.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((i) => (i - 1 + filteredSlash.length) % filteredSlash.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applySlash(filteredSlash[slashIndex]);
        return;
      }
      if (e.key === "Escape") {
        setSlashOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)", borderLeft: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 flex-none" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <TbSparkles size={16} style={{ color: "var(--text-muted)" }} />
          <span>{t("askAI.title")}</span>
        </div>
        <button onClick={newChat} className="btn btn-ghost">
          <TbPlus size={14} />
          <span className="text-xs">{t("chat.newChat")}</span>
        </button>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 px-4 py-2 text-[11px] flex-none" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="badge">
          {provider?.name || "..."} · {cfg.model || "?"}
        </span>
        {activeSkillCount > 0 && (
          <span className="badge flex items-center gap-1" style={{ color: "var(--text)", borderColor: "var(--border-strong)" }}>
            <TbBolt size={11} /> {activeSkillCount} {t("chat.skills")}
          </span>
        )}
        {activeToolCount > 0 && (
          <span className="badge flex items-center gap-1" style={{ color: "var(--success)" }}>
            <TbTool size={11} /> {activeToolCount} {t("chat.tools")}
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <TbSparkles size={28} className="mx-auto" />
            </div>
            <div className="text-sm">{t("askAI.placeholder")}</div>
            <div className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
              Type <code style={{ background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border)", fontFamily: "var(--font-code, monospace)" }}>/</code> to browse skills
            </div>
          </div>
        ) : (
          <div className="chat-container">
            {messages.map((m: ChatMessage) => {
              if (m.isToolEvent) {
                return (
                  <div key={m.id} className="animate-fade-in-up">
                    <div className="tool-chip">
                      <TbTool size={12} />
                      <span className="tool-server">{m.toolServer}</span>
                      <span style={{ color: "var(--text-dim)" }}>/</span>
                      <span style={{ color: "var(--text)" }}>{m.toolName}</span>
                    </div>
                  </div>
                );
              }
              if (m.role === "user") {
                return (
                  <div key={m.id} className="chat-message chat-message-user animate-fade-in-up">
                    <div className="chat-role-label">You</div>
                    <div className="chat-content chat-content-user">{m.content}</div>
                  </div>
                );
              }
              const preview = (m.html || m.content || "").replace(/<[^>]+>/g, "").slice(0, 280);
              const isLastAssistant = isWorking && m.id === messages[messages.length - 1]?.id;
              return (
                <div key={m.id} className="chat-message chat-message-assistant animate-fade-in-up">
                  <div className="chat-role-label">Assistant</div>
                  <div className={`chat-content chat-content-assistant ${isLastAssistant ? "chat-cursor" : ""}`}>
                    {preview || (isWorking ? "" : "(empty)")}
                  </div>
                  {m.html && (
                    <button
                      onClick={() => copyMsg(m)}
                      className="btn btn-ghost mt-1"
                      style={{ padding: "4px 8px", fontSize: 11 }}
                    >
                      {copiedId === m.id ? <TbCheck size={12} /> : <TbCopy size={12} />}
                      <span>{copiedId === m.id ? t("chat.copied") : t("chat.copy")}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 flex-none relative" style={{ borderTop: "1px solid var(--border)" }}>
        {slashOpen && filteredSlash.length > 0 && (
          <div className="slash-menu">
            {filteredSlash.map((item, idx) => (
              <div
                key={item.id}
                className={`slash-menu-item ${idx === slashIndex ? "selected" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applySlash(item);
                }}
                onMouseEnter={() => setSlashIndex(idx)}
              >
                <div className="slash-icon">
                  {item.id === "__clone" ? <TbSparkles size={14} /> : <TbBolt size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="slash-name">
                    {item.name} <span className="cmd">{item.cmd}</span>
                  </div>
                  <div className="slash-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="input-bar">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("chat.placeholder")}
            rows={3}
            className="w-full bg-transparent text-sm px-3 py-2 resize-none focus:outline-none"
            style={{ color: "var(--text)" }}
            disabled={isWorking}
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="text-[11px]" style={{ color: "var(--text-dim)" }}>
              {provider?.name} · {cfg.model || "?"}
            </div>
            {isWorking ? (
              <button onClick={stop} className="btn btn-danger">
                <TbSquare size={12} />
                <span>{t("chat.stop")}</span>
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!input.trim()}
                className="btn btn-primary"
              >
                {input.trim() ? <TbSend size={12} /> : <TbLoader2 size={12} />}
                <span>{t("chat.send")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
