import classNames from "classnames";
import { useTranslation } from "react-i18next";
import { TbEye, TbCode, TbRefresh, TbCopy, TbDownload } from "react-icons/tb";
import { toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { editor as MonacoEditor } from "monaco-editor";

interface EditorPreviewProps {
  html: string;
  setHtml: (s: string) => void;
  isWorking: boolean;
  isStreaming: boolean; // true during AI streaming
}

export default function EditorPreview({
  html,
  setHtml,
  isWorking,
  isStreaming,
}: EditorPreviewProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [previewHtml, setPreviewHtml] = useState(html);
  const lastUpdateRef = useRef<number>(Date.now());
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Throttled preview update — sync preview with html when not auto-refreshing
  // (i.e. on initial mount) AND when html is updated externally (e.g. AI
  // streaming completes)
  useEffect(() => {
    if (!autoRefresh) {
      setPreviewHtml(html);
      return;
    }
    const now = Date.now();
    const throttle = isWorking || isStreaming ? 1500 : 800;
    if (previewHtml !== html && now - lastUpdateRef.current >= throttle) {
      setPreviewHtml(html);
      lastUpdateRef.current = now;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, autoRefresh, isWorking, isStreaming]);

  // Update preview (throttled)
  const onHtmlChange = (val: string) => {
    setHtml(val);
    if (!autoRefresh) return;
    const now = Date.now();
    const throttle = isWorking || isStreaming ? 1500 : 800;
    if (now - lastUpdateRef.current >= throttle) {
      setPreviewHtml(val);
      lastUpdateRef.current = now;
    } else {
      setTimeout(() => {
        setPreviewHtml(val);
        lastUpdateRef.current = Date.now();
      }, throttle);
    }
  };

  const refreshPreview = () => {
    setPreviewHtml(html);
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.location.reload();
      } catch {
        const s = iframeRef.current.srcdoc;
        iframeRef.current.srcdoc = "";
        setTimeout(() => (iframeRef.current!.srcdoc = s), 10);
      }
    }
    toast.info(t("preview.refreshPreview"), { autoClose: 800 });
  };

  const copyHtml = () => {
    navigator.clipboard.writeText(html);
    toast.success(t("preview.copySuccess"));
  };

  const downloadHtml = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("preview.downloadSuccess"));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
      {/* Tab strip */}
      <div className="flex items-center justify-between bg-[#252526] border-b border-[#1e1e1e] px-2 flex-none">
        <div className="flex">
          <TabButton
            active={tab === "editor"}
            onClick={() => setTab("editor")}
            icon={<TbCode size={14} />}
            label="index.html"
          />
          <TabButton
            active={tab === "preview"}
            onClick={() => setTab("preview")}
            icon={<TbEye size={14} />}
            label={t("tabs.preview")}
          />
        </div>
        <div className="flex items-center gap-1 pr-1">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? t("preview.autoRefreshOff") : t("preview.autoRefreshOn")}
            className={`text-xs px-2 py-1 rounded ${autoRefresh ? "text-indigo-400" : "text-[#7a7a7a]"}`}
          >
            <TbRefresh size={14} />
          </button>
          <button
            onClick={refreshPreview}
            title={t("preview.refreshPreview")}
            className="text-[#9a9a9a] hover:text-white px-2 py-1 rounded hover:bg-[#3c3c3c]"
          >
            <TbRefresh size={14} />
          </button>
          <button
            onClick={copyHtml}
            title={t("preview.copyTooltip")}
            className="text-[#9a9a9a] hover:text-white px-2 py-1 rounded hover:bg-[#3c3c3c]"
          >
            <TbCopy size={14} />
          </button>
          <button
            onClick={downloadHtml}
            title={t("preview.downloadTooltip")}
            className="text-[#9a9a9a] hover:text-white px-2 py-1 rounded hover:bg-[#3c3c3c]"
          >
            <TbDownload size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        <div
          className={classNames(
            "absolute inset-0 flex flex-col",
            tab === "editor" ? "block" : "hidden"
          )}
        >
          <Editor
            language="html"
            theme="vs-dark"
            value={html}
            onChange={(val) => onHtmlChange(val ?? "")}
            onMount={(ed) => (editorRef.current = ed)}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              tabSize: 2,
            }}
            className={classNames(
              "flex-1",
              isWorking || isStreaming ? "pointer-events-none" : ""
            )}
          />
        </div>
        <div
          className={classNames(
            "absolute inset-0",
            tab === "preview" ? "block" : "hidden"
          )}
        >
          <iframe
            ref={iframeRef}
            title="preview"
            srcDoc={previewHtml}
            className="w-full h-full bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors",
        active
          ? "text-white border-indigo-500 bg-[#1e1e1e]"
          : "text-[#9a9a9a] border-transparent hover:text-white hover:bg-[#2d2d2d]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
