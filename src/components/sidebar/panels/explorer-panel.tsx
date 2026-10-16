import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TbChevronDown,
  TbChevronRight,
  TbFile,
  TbRefresh,
  TbDeviceMobile,
  TbCode,
  TbStack2,
  TbBrandReact,
  TbBrandAndroid,
} from "react-icons/tb";

interface ExplorerPanelProps {
  html: string;
  onReset: () => void;
  onTemplateChange: (framework: string, ui: string | null, tools: string[]) => void;
  selectedTemplateId: string;
  selectedUI: string | null;
  selectedTools: string[];
  projectFiles: Record<string, string> | null;
  activeFile: string;
  setActiveFile: (f: string) => void;
}

export default function ExplorerPanel({
  html,
  onReset,
  onTemplateChange,
  selectedTemplateId,
  projectFiles,
  activeFile,
  setActiveFile,
}: ExplorerPanelProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fullstackOpen, setFullstackOpen] = useState(false);

  const lineCount = html ? html.split("\n").length : 0;
  const sizeKb = (new Blob([html]).size / 1024).toFixed(1);

  const basicTemplates = [
    { id: "vanilla", name: "TailwindCSS HTML" },
    { id: "vue3", name: "Vue 3" },
  ];

  const mobileTemplates = [
    { id: "react-native-web", name: "React Native Web", icon: <TbBrandReact size={14} /> },
    { id: "material-android", name: "Material 3 (Android-style)", icon: <TbBrandAndroid size={14} /> },
  ];

  const fullstackTemplates = [
    { id: "nextjs-fullstack", name: "Next.js Full-Stack", icon: <TbStack2 size={14} /> },
    { id: "express-react", name: "Express + React", icon: <TbStack2 size={14} /> },
    { id: "mern-stack", name: "MERN (Mongo/Express/React/Node)", icon: <TbStack2 size={14} /> },
  ];

  return (
    <div className="text-[#cccccc]">
      {/* Current project */}
      <div className="tree-row" onClick={() => setOpen(!open)}>
        {open ? <TbChevronDown size={14} /> : <TbChevronRight size={14} />}
        <span className="font-medium">{t("sidebar.welcome")}</span>
      </div>
      {open && (
        <>
          {projectFiles ? (
            // Multi-file project mode — render file tree
            Object.keys(projectFiles).map((f) => {
              const parts = f.split("/");
              const fname = parts.pop()!;
              const depth = parts.length;
              return (
                <div
                  key={f}
                  className={`tree-row ${activeFile === f ? "active" : ""}`}
                  style={{ paddingLeft: 16 + depth * 12 }}
                  onClick={() => setActiveFile(f)}
                >
                  <TbFile size={14} style={{ color: "var(--text-muted)" }} />
                  <span>{fname}</span>
                </div>
              );
            })
          ) : (
            <div
              className={`tree-row active ${true ? "" : ""}`}
              style={{ paddingLeft: 32 }}
            >
              <TbFile size={16} style={{ color: "#e5a938" }} />
              <span>index.html</span>
            </div>
          )}
          <div className="px-4 py-1 text-[11px]" style={{ color: "var(--text-dim)" }}>
            {projectFiles
              ? `${Object.keys(projectFiles).length} files`
              : `${lineCount} lines · ${sizeKb} KB`}
          </div>
        </>
      )}

      <div className="divider my-2" />

      {/* Basic templates */}
      <div className="tree-row" onClick={() => setTemplatesOpen(!templatesOpen)}>
        {templatesOpen ? <TbChevronDown size={14} /> : <TbChevronRight size={14} />}
        <TbCode size={14} style={{ color: "var(--text-muted)" }} />
        <span className="font-medium text-xs uppercase tracking-wider">Basic</span>
      </div>
      {templatesOpen && (
        <>
          {basicTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className={`tree-row ${selectedTemplateId === tpl.id ? "active" : ""}`}
              style={{ paddingLeft: 32 }}
              onClick={() => onTemplateChange(tpl.id, null, [])}
            >
              <TbFile size={14} />
              <span>{tpl.name}</span>
            </div>
          ))}
        </>
      )}

      {/* Mobile templates */}
      <div className="tree-row" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <TbChevronDown size={14} /> : <TbChevronRight size={14} />}
        <TbDeviceMobile size={14} style={{ color: "var(--text-muted)" }} />
        <span className="font-medium text-xs uppercase tracking-wider">Mobile</span>
      </div>
      {mobileOpen && (
        <>
          {mobileTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className={`tree-row ${selectedTemplateId === tpl.id ? "active" : ""}`}
              style={{ paddingLeft: 32 }}
              onClick={() => onTemplateChange(tpl.id, null, [])}
            >
              {tpl.icon}
              <span>{tpl.name}</span>
            </div>
          ))}
        </>
      )}

      {/* Fullstack templates */}
      <div className="tree-row" onClick={() => setFullstackOpen(!fullstackOpen)}>
        {fullstackOpen ? <TbChevronDown size={14} /> : <TbChevronRight size={14} />}
        <TbStack2 size={14} style={{ color: "var(--text-muted)" }} />
        <span className="font-medium text-xs uppercase tracking-wider">Full-Stack</span>
      </div>
      {fullstackOpen && (
        <>
          {fullstackTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className={`tree-row ${selectedTemplateId === tpl.id ? "active" : ""}`}
              style={{ paddingLeft: 32 }}
              onClick={() => onTemplateChange(tpl.id, null, [])}
            >
              {tpl.icon}
              <span>{tpl.name}</span>
            </div>
          ))}
        </>
      )}

      <div className="divider my-2" />

      <div className="px-4 py-2">
        <button onClick={onReset} className="btn btn-secondary w-full justify-center">
          <TbRefresh size={14} />
          <span>{t("header.new")}</span>
        </button>
      </div>
    </div>
  );
}
