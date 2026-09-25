import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { TbTrash, TbPlus, TbChevronDown, TbChevronRight } from "react-icons/tb";
import { useMcpStore } from "../../../store/mcpStore";

export default function McpPanel() {
  const { t } = useTranslation();
  const { servers, enabledTools, load, addServer, removeServer, toggleTool, isToolEnabled } = useMcpStore();
  const _load = load; // available if needed
  void _load;
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"stdio" | "http">("stdio");
  const [id, setId] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [env, setEnv] = useState("");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState("");

  const reset = () => {
    setId("");
    setCommand("");
    setArgs("");
    setEnv("");
    setUrl("");
    setHeaders("");
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!id) {
      toast.error("id required");
      return;
    }
    try {
      if (formType === "stdio") {
        const argsArr = args
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean);
        const envObj: Record<string, string> = {};
        for (const line of env.split("\n")) {
          const idx = line.indexOf("=");
          if (idx > 0) {
            envObj[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
          }
        }
        await addServer(id, {
          type: "stdio",
          command,
          args: argsArr,
          env: envObj,
        });
      } else {
        const headersObj: Record<string, string> = {};
        for (const line of headers.split("\n")) {
          const idx = line.indexOf(":");
          if (idx > 0) {
            headersObj[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
          }
        }
        await addServer(id, {
          type: "http",
          url,
          headers: headersObj,
        });
      }
      toast.success("Server added");
      reset();
    } catch (e: any) {
      toast.error(e.message || "Failed to add server");
    }
  };

  return (
    <div className="p-3 text-[#cccccc] space-y-3">
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded"
      >
        <TbPlus size={16} />
        {t("mcp.addServer")}
      </button>

      {showForm && (
        <div className="space-y-3 bg-[#2d2d2d] border border-[#3c3c3c] rounded p-3">
          <div className="flex gap-2">
            <button
              className={`flex-1 py-1 text-xs rounded ${formType === "stdio" ? "bg-indigo-600 text-white" : "bg-[#3c3c3c] text-[#ccc]"}`}
              onClick={() => setFormType("stdio")}
            >
              stdio
            </button>
            <button
              className={`flex-1 py-1 text-xs rounded ${formType === "http" ? "bg-indigo-600 text-white" : "bg-[#3c3c3c] text-[#ccc]"}`}
              onClick={() => setFormType("http")}
            >
              http / sse
            </button>
          </div>

          <input
            placeholder="id (unique name)"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5"
          />
          {formType === "stdio" ? (
            <>
              <input
                placeholder={t("mcp.command") + " (e.g. npx)"}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5 font-code"
              />
              <input
                placeholder={t("mcp.args") + " (e.g. -y, @modelcontextprotocol/server-filesystem, /tmp)"}
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5 font-code"
              />
              <textarea
                placeholder={t("mcp.env")}
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                rows={3}
                className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-xs rounded px-2 py-1.5 font-code"
              />
            </>
          ) : (
            <>
              <input
                placeholder={t("mcp.url")}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5 font-code"
              />
              <textarea
                placeholder={t("mcp.headers")}
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                rows={3}
                className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-xs rounded px-2 py-1.5 font-code"
              />
            </>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1.5 rounded"
            >
              {t("mcp.save")}
            </button>
            <button
              onClick={reset}
              className="px-3 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white text-xs py-1.5 rounded"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="divider" />

      {servers.length === 0 && (
        <div className="text-xs text-[#8a8a8a] px-2">{t("mcp.noServers")}</div>
      )}

      {servers.map((srv) => (
        <McpServerCard
          key={srv.id}
          srv={srv}
          enabledTools={enabledTools}
          onToggle={toggleTool}
          isToolEnabled={isToolEnabled}
          onRemove={async () => {
            await removeServer(srv.id);
            toast.success("Removed");
          }}
        />
      ))}
    </div>
  );
}

function McpServerCard({ srv, enabledTools: _enabledTools, onToggle, isToolEnabled, onRemove }: any) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const statusColor =
    srv.status === "ready"
      ? "text-green-400"
      : srv.status === "connecting"
      ? "text-amber-400"
      : srv.status === "error"
      ? "text-red-400"
      : "text-gray-500";

  return (
    <div className="border border-[#3c3c3c] rounded bg-[#2d2d2d]">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? <TbChevronDown size={14} /> : <TbChevronRight size={14} />}
          <span className="text-sm font-medium text-white">{srv.id}</span>
          <span className={`text-[10px] uppercase ${statusColor}`}>{srv.status}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-[#9a9a9a] hover:text-red-400"
        >
          <TbTrash size={14} />
        </button>
      </div>
      {open && (
        <div className="px-3 pb-2">
          {srv.error && (
            <div className="text-[11px] text-red-400 mb-1 break-all">{srv.error}</div>
          )}
          <div className="text-[11px] text-[#9a9a9a] uppercase mb-1">{t("mcp.tools")}</div>
          {(srv.tools || []).length === 0 ? (
            <div className="text-xs text-[#8a8a8a]">{t("mcp.noTools")}</div>
          ) : (
            <div className="space-y-1">
              {srv.tools.map((tool: any) => {
                const key = `${srv.id}/${tool.name}`;
                const on = isToolEnabled(key);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-white truncate">{tool.name}</div>
                      <div className="text-[11px] text-[#8a8a8a] truncate">
                        {tool.description}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(key);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        on
                          ? "bg-indigo-600 text-white"
                          : "bg-[#3c3c3c] text-[#ccc] hover:bg-[#4c4c4c]"
                      }`}
                    >
                      {on ? t("mcp.enableTool") : t("mcp.enableTool")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
