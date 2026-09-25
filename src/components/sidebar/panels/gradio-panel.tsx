import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  TbPlayerPlay,
  TbPlayerStop,
  TbTrash,
  TbCopy,
  TbExternalLink,
  TbLoader2,
  TbBrandPython,
  TbPlugConnected,
  TbChevronDown,
  TbChevronRight,
} from "react-icons/tb";
import { useGradioStore } from "../../../store/gradioStore";

export default function GradioPanel() {
  const { t } = useTranslation();
  const {
    code,
    share,
    mcpServer,
    serverName,
    serverPort,
    setCode,
    setShare,
    setMcpServer,
    setServerName,
    setServerPort,
    launch,
    pythonAvailable,
    pythonPath,
    gradioVersion,
    pythonMessage,
    servers,
    selectedId,
    select,
    selectedLogs,
    stop,
    remove,
  } = useGradioStore();

  const handleLaunch = async () => {
    if (pythonAvailable === false) {
      toast.error(pythonMessage || "Python + Gradio 6+ required");
      return;
    }
    if (!code.trim()) {
      toast.error("Code is empty");
      return;
    }
    const srv = await launch();
    if (!srv) {
      toast.error("Launch failed");
    } else {
      toast.success("Launching Gradio server…");
      select(srv.id);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success(t("common.copied"));
  };

  return (
    <div className="p-3 text-[#cccccc] space-y-3">
      {/* Python availability badge */}
      <div
        className={`text-xs px-2 py-1.5 rounded border ${
          pythonAvailable
            ? "bg-emerald-900/30 border-emerald-700/50 text-emerald-300"
            : "bg-amber-900/30 border-amber-700/50 text-amber-300"
        }`}
      >
        <div className="flex items-center gap-2">
          <TbBrandPython size={14} />
          {pythonAvailable ? (
            <>
              <span className="font-medium">{pythonPath}</span>
              <span className="opacity-60">·</span>
              <span>gradio {gradioVersion}</span>
            </>
          ) : pythonAvailable === null ? (
            <span>checking…</span>
          ) : (
            <span>{pythonMessage || "Python / Gradio 6+ not detected"}</span>
          )}
        </div>
      </div>

      {/* Launch options */}
      <div className="space-y-2 bg-[#2d2d2d] border border-[#3c3c3c] rounded p-3">
        <div className="text-[11px] uppercase text-[#9a9a9a]">
          {t("gradio.launchOptions")}
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={share}
            onChange={(e) => setShare(e.target.checked)}
            className="accent-indigo-500"
          />
          {t("gradio.shareUrl")}
          <span className="text-[#8a8a8a] text-[10px]">(.gradio.live)</span>
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={mcpServer}
            onChange={(e) => setMcpServer(e.target.checked)}
            className="accent-indigo-500"
          />
          {t("gradio.mcpServer")}
          <TbPlugConnected size={12} className="text-emerald-400" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] uppercase text-[#9a9a9a] mb-0.5">
              {t("gradio.serverName")}
            </label>
            <input
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-xs rounded px-2 py-1 font-code"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-[#9a9a9a] mb-0.5">
              {t("gradio.serverPort")}
            </label>
            <input
              type="number"
              value={serverPort}
              onChange={(e) => setServerPort(Number(e.target.value))}
              className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-xs rounded px-2 py-1 font-code"
            />
          </div>
        </div>
      </div>

      {/* Code editor (tiny) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] uppercase text-[#9a9a9a]">
            server.py
          </span>
          <button
            onClick={handleCopyCode}
            className="text-[#9a9a9a] hover:text-white"
            title={t("common.copy")}
          >
            <TbCopy size={12} />
          </button>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={10}
          spellCheck={false}
          className="w-full bg-[#1e1e1e] border border-[#3c3c3c] text-[#dcdcaa] text-xs rounded px-2 py-1.5 font-code resize-y"
          placeholder="import gradio as gr&#10;server = gr.Server()&#10;..."
        />
      </div>

      {/* Launch button */}
      <button
        onClick={handleLaunch}
        disabled={pythonAvailable === false || !code.trim()}
        className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded"
      >
        <TbPlayerPlay size={16} />
        {t("gradio.launch")}
      </button>

      <div className="divider" />

      {/* Running servers list */}
      <div className="text-[11px] uppercase text-[#9a9a9a]">
        {t("gradio.running")}
      </div>
      {servers.length === 0 ? (
        <div className="text-xs text-[#8a8a8a]">{t("gradio.noneRunning")}</div>
      ) : (
        <div className="space-y-2">
          {servers.map((srv) => (
            <GradioServerCard
              key={srv.id}
              srv={srv}
              selected={srv.id === selectedId}
              onSelect={() => select(srv.id === selectedId ? null : srv.id)}
              onStop={() => stop(srv.id)}
              onRemove={() => remove(srv.id)}
            />
          ))}
        </div>
      )}

      {/* Selected server logs */}
      {selectedId && (
        <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded">
          <div className="panel-header">
            <span>{t("gradio.logs")}</span>
            <span className="text-[10px] text-[#7a7a7a] normal-case">
              {selectedLogs.length} lines
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto p-2 text-[11px] font-code space-y-0.5">
            {selectedLogs.length === 0 ? (
              <div className="text-[#7a7a7a]">{t("gradio.noLogs")}</div>
            ) : (
              selectedLogs.slice(-300).map((l, i) => (
                <div
                  key={i}
                  className={
                    l.kind === "stderr"
                      ? "text-[#f48771]"
                      : "text-[#dcdcaa]"
                  }
                >
                  {l.text}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GradioServerCard({
  srv,
  selected,
  onSelect,
  onStop,
  onRemove,
}: {
  srv: any;
  selected: boolean;
  onSelect: () => void;
  onStop: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const statusColor =
    srv.status === "running"
      ? "text-emerald-400"
      : srv.status === "starting"
      ? "text-amber-400"
      : srv.status === "error"
      ? "text-red-400"
      : "text-gray-500";

  return (
    <div className="border border-[#3c3c3c] rounded bg-[#2d2d2d]">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        onClick={onSelect}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selected ? (
            <TbChevronDown size={14} />
          ) : (
            <TbChevronRight size={14} />
          )}
          {srv.status === "starting" && (
            <TbLoader2 size={12} className="animate-spin text-amber-400" />
          )}
          <span className="text-[11px] text-[#9a9a9a] font-mono truncate">
            {srv.id.slice(0, 8)}
          </span>
          <span className={`text-[10px] uppercase ${statusColor}`}>
            {srv.status}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {srv.status === "running" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStop();
              }}
              className="text-[#9a9a9a] hover:text-red-400 p-1"
              title={t("gradio.stop")}
            >
              <TbPlayerStop size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-[#9a9a9a] hover:text-red-400 p-1"
            title={t("gradio.remove")}
          >
            <TbTrash size={14} />
          </button>
        </div>
      </div>
      {selected && (
        <div className="px-3 pb-3 space-y-2">
          {srv.urls.local && (
            <UrlRow label="local" url={srv.urls.local} />
          )}
          {srv.urls.share && (
            <UrlRow label="share" url={srv.urls.share} highlight />
          )}
          {srv.urls.mcp && (
            <UrlRow label="mcp" url={srv.urls.mcp} icon={<TbPlugConnected size={11} />} />
          )}
          {!srv.urls.local && !srv.urls.share && srv.status === "starting" && (
            <div className="text-[11px] text-amber-400 flex items-center gap-1">
              <TbLoader2 size={12} className="animate-spin" />
              {t("gradio.waitingForUrl")}
            </div>
          )}
          {srv.error && (
            <div className="text-[11px] text-red-400 break-all">
              {srv.error}
            </div>
          )}
          <div className="text-[10px] text-[#7a7a7a]">
            pid {srv.pid} · started {new Date(srv.startedAt).toLocaleTimeString()}
            {srv.stoppedAt && ` · stopped ${new Date(srv.stoppedAt).toLocaleTimeString()}`}
            {srv.exitCode !== null && ` · exit ${srv.exitCode}`}
          </div>
        </div>
      )}
    </div>
  );
}

function UrlRow({
  label,
  url,
  highlight,
  icon,
}: {
  label: string;
  url: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  const copy = () => {
    navigator.clipboard.writeText(url);
  };
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`uppercase text-[10px] px-1.5 py-0.5 rounded ${
          highlight
            ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/50"
            : "bg-[#3c3c3c] text-[#bbb]"
        }`}
      >
        {icon}
        {label}
      </span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 truncate text-indigo-300 hover:text-indigo-200 underline font-code text-[11px]"
      >
        {url}
      </a>
      <button
        onClick={copy}
        className="text-[#9a9a9a] hover:text-white p-0.5"
        title="Copy"
      >
        <TbCopy size={12} />
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#9a9a9a] hover:text-white p-0.5"
        title="Open"
      >
        <TbExternalLink size={12} />
      </a>
    </div>
  );
}
