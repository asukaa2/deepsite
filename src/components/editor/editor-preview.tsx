import classNames from "classnames";
import { useTranslation } from "react-i18next";
import {
  TbEye,
  TbCode,
  TbRefresh,
  TbCopy,
  TbDownload,
  TbDeviceMobile,
  TbDeviceDesktop,
  TbX,
} from "react-icons/tb";
import { toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { editor as MonacoEditor } from "monaco-editor";

interface EditorPreviewProps {
  html: string;
  setHtml: (s: string) => void;
  isWorking: boolean;
  isStreaming: boolean;
  projectFiles: Record<string, string> | null;
  activeFile: string;
  setActiveFile: (f: string) => void;
  setProjectFiles: (f: Record<string, string> | null) => void;
}

type PreviewMode = "desktop" | "mobile";

export default function EditorPreview({
  html,
  setHtml,
  isWorking,
  isStreaming,
  projectFiles,
  activeFile,
  setActiveFile,
  setProjectFiles,
}: EditorPreviewProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [previewHtml, setPreviewHtml] = useState(html);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const lastUpdateRef = useRef<number>(Date.now());
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Active file content for project mode (falls back to single html)
  const activeFileContent = projectFiles && projectFiles[activeFile]
    ? projectFiles[activeFile]
    : html;

  const editorLanguage = (() => {
    if (!projectFiles) return "html";
    const ext = activeFile.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "ts": case "tsx": return "typescript";
      case "js": case "jsx": return "javascript";
      case "json": return "json";
      case "css": return "css";
      case "md": return "markdown";
      default: return "html";
    }
  })();

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

  const onActiveFileChange = (val: string) => {
    if (projectFiles) {
      setProjectFiles({ ...projectFiles, [activeFile]: val });
    } else {
      setHtml(val);
    }
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
    navigator.clipboard.writeText(activeFileContent);
    toast.success(t("preview.copySuccess"));
  };

  const downloadHtml = () => {
    const filename = projectFiles ? activeFile : "index.html";
    const blob = new Blob([activeFileContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.split("/").pop() || "file.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("preview.downloadSuccess"));
  };

  const closeFile = (e: React.MouseEvent, f: string) => {
    e.stopPropagation();
    if (!projectFiles) return;
    const remaining = { ...projectFiles };
    delete remaining[f];
    if (Object.keys(remaining).length === 0) {
      setProjectFiles(null);
    } else {
      setProjectFiles(remaining);
      if (activeFile === f) {
        setActiveFile(Object.keys(remaining)[0]);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ background: "var(--bg)" }}>
      {/* Tab strip */}
      <div className="flex items-center justify-between flex-none" style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex overflow-x-auto">
          {/* Project-mode file tabs OR single-file editor/preview tabs */}
          {projectFiles ? (
            Object.keys(projectFiles).map((f) => (
              <div
                key={f}
                className={`file-tab ${activeFile === f ? "active" : ""}`}
                onClick={() => setActiveFile(f)}
              >
                <TbCode size={12} />
                <span>{f.split("/").pop()}</span>
                <button
                  onClick={(e) => closeFile(e, f)}
                  className="hover:opacity-100 opacity-50"
                  style={{ marginLeft: 4 }}
                >
                  <TbX size={10} />
                </button>
              </div>
            ))
          ) : (
            <>
              <button
                onClick={() => setTab("editor")}
                className={classNames(
                  "flex items-center gap-1.5 px-3 py-2 text-xs transition-colors",
                  tab === "editor"
                    ? "text-white border-b-2 border-white"
                    : "text-[var(--text-muted)] hover:text-white border-b-2 border-transparent"
                )}
                style={tab === "editor" ? { background: "var(--bg)", borderBottomColor: "var(--text)" } : {}}
              >
                <TbCode size={14} />
                {projectFiles ? activeFile.split("/").pop() : "index.html"}
              </button>
              <button
                onClick={() => setTab("preview")}
                className={classNames(
                  "flex items-center gap-1.5 px-3 py-2 text-xs transition-colors",
                  tab === "preview"
                    ? "text-white border-b-2 border-white"
                    : "text-[var(--text-muted)] hover:text-white border-b-2 border-transparent"
                )}
                style={tab === "preview" ? { background: "var(--bg)", borderBottomColor: "var(--text)" } : {}}
              >
                <TbEye size={14} />
                {t("tabs.preview")}
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 pr-2">
          {/* Preview mode toggle */}
          {(!projectFiles || tab === "preview") && (
            <div className="flex items-center mr-1" style={{ border: "1px solid var(--border)", borderRadius: 6 }}>
              <button
                onClick={() => setPreviewMode("desktop")}
                title="Desktop"
                className="px-2 py-1 rounded-l"
                style={{
                  background: previewMode === "desktop" ? "var(--bg-elevated-2)" : "transparent",
                  color: previewMode === "desktop" ? "var(--text)" : "var(--text-muted)",
                }}
              >
                <TbDeviceDesktop size={14} />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                title="Mobile / Android"
                className="px-2 py-1 rounded-r"
                style={{
                  background: previewMode === "mobile" ? "var(--bg-elevated-2)" : "transparent",
                  color: previewMode === "mobile" ? "var(--text)" : "var(--text-muted)",
                }}
              >
                <TbDeviceMobile size={14} />
              </button>
            </div>
          )}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? t("preview.autoRefreshOff") : t("preview.autoRefreshOn")}
            className="btn btn-ghost"
            style={{ padding: "4px 8px" }}
          >
            <TbRefresh size={14} style={{ color: autoRefresh ? "var(--text)" : "var(--text-dim)" }} />
          </button>
          <button
            onClick={refreshPreview}
            title={t("preview.refreshPreview")}
            className="btn btn-ghost"
            style={{ padding: "4px 8px" }}
          >
            <TbRefresh size={14} />
          </button>
          <button
            onClick={copyHtml}
            title={t("preview.copyTooltip")}
            className="btn btn-ghost"
            style={{ padding: "4px 8px" }}
          >
            <TbCopy size={14} />
          </button>
          <button
            onClick={downloadHtml}
            title={t("preview.downloadTooltip")}
            className="btn btn-ghost"
            style={{ padding: "4px 8px" }}
          >
            <TbDownload size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        {/* Editor */}
        <div
          className={classNames(
            "absolute inset-0 flex flex-col",
            projectFiles || tab === "editor" ? "block" : "hidden"
          )}
        >
          <Editor
            language={editorLanguage}
            theme="vs-dark"
            value={activeFileContent}
            onChange={(val) => onActiveFileChange(val ?? "")}
            onMount={(ed) => (editorRef.current = ed)}
            options={{
              fontSize: 13,
              fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              tabSize: 2,
              lineNumbers: "on",
              padding: { top: 12, bottom: 12 },
            }}
            className={classNames(
              "flex-1",
              isWorking || isStreaming ? "pointer-events-none" : ""
            )}
          />
        </div>

        {/* Preview */}
        {!projectFiles && (
          <div
            className={classNames(
              "absolute inset-0 flex items-center justify-center",
              tab === "preview" ? "block" : "hidden"
            )}
            style={{ background: "#0a0a0a" }}
          >
            {previewMode === "mobile" ? (
              <div className="device-frame" style={{ width: 390, height: "100%", maxHeight: "100%" }}>
                <iframe
                  ref={iframeRef}
                  title="preview-mobile"
                  srcDoc={previewHtml}
                  className="w-full h-full bg-white"
                  style={{ borderRadius: 24, border: "none" }}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                title="preview-desktop"
                srcDoc={previewHtml}
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
