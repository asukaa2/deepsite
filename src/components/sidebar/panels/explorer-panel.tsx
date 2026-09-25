import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TbChevronDown, TbChevronRight, TbFile, TbRefresh } from "react-icons/tb";

interface ExplorerPanelProps {
  html: string;
  onReset: () => void;
  onTemplateChange: (framework: string, ui: string | null, tools: string[]) => void;
  selectedTemplateId: string;
  selectedUI: string | null;
  selectedTools: string[];
}

export default function ExplorerPanel({
  html,
  onReset,
  onTemplateChange,
  selectedTemplateId,
}: ExplorerPanelProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const lineCount = html ? html.split("\n").length : 0;
  const sizeKb = (new Blob([html]).size / 1024).toFixed(1);

  const templates = [
    { id: "vanilla", name: "TailwindCSS HTML" },
    { id: "vue3", name: "Vue 3" },
  ];

  return (
    <div className="text-[#cccccc]">
      <div className="tree-row" onClick={() => setOpen(!open)}>
        {open ? <TbChevronDown size={14} /> : <TbChevronRight size={14} />}
        <span className="font-medium">{t("sidebar.welcome")}</span>
      </div>
      {open && (
        <>
          <div className="tree-row active pl-8">
            <TbFile size={16} className="text-orange-400" />
            <span>index.html</span>
          </div>
          <div className="px-8 py-1 text-[11px] text-[#6e6e6e]">
            {lineCount} lines · {sizeKb} KB
          </div>
        </>
      )}

      <div className="divider my-2" />

      <div className="tree-row" onClick={() => setTemplatesOpen(!templatesOpen)}>
        {templatesOpen ? <TbChevronDown size={14} /> : <TbChevronRight size={14} />}
        <span className="font-medium">TEMPLATES</span>
      </div>
      {templatesOpen && (
        <>
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className={`tree-row pl-8 ${selectedTemplateId === tpl.id ? "active" : ""}`}
              onClick={() => onTemplateChange(tpl.id, null, [])}
            >
              <TbFile size={14} />
              <span>{tpl.name}</span>
            </div>
          ))}
        </>
      )}

      <div className="divider my-2" />

      <div className="px-4 py-2">
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 text-xs bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white py-2 rounded"
        >
          <TbRefresh size={14} />
          {t("header.new")}
        </button>
      </div>
    </div>
  );
}
