import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ActivityBar, { SidebarView } from "./activity-bar";
import ExplorerPanel from "./panels/explorer-panel";
import ProvidersPanel from "./panels/providers-panel";
import McpPanel from "./panels/mcp-panel";
import SkillsPanel from "./panels/skills-panel";
import ClonerPanel from "./panels/cloner-panel";
import GradioPanel from "./panels/gradio-panel";
import SettingsPanel from "./panels/settings-panel";
import { useProvidersStore } from "../../store/providersStore";
import { useMcpStore } from "../../store/mcpStore";
import { useSkillsStore } from "../../store/skillsStore";
import { useGradioStore } from "../../store/gradioStore";

interface SidebarProps {
  // Pass-through callbacks for Explorer
  html: string;
  onReset: () => void;
  onTemplateChange: (framework: string, ui: string | null, tools: string[]) => void;
  selectedTemplateId: string;
  selectedUI: string | null;
  selectedTools: string[];
  modelParams: any;
  onModelParamsChange: (params: any) => void;
  onClone: (cloneData: any) => void;
}

export default function Sidebar(props: SidebarProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<SidebarView>("explorer");

  // Pre-load all sidebar-relevant stores
  const loadProviders = useProvidersStore((s) => s.load);
  const loadMcp = useMcpStore((s) => s.load);
  const loadSkills = useSkillsStore((s) => s.load);
  const loadGradio = useGradioStore((s) => s.load);

  useEffect(() => {
    loadProviders();
    loadMcp();
    loadSkills();
    loadGradio();
  }, [loadProviders, loadMcp, loadSkills, loadGradio]);

  const titleKey =
    view === "explorer" ? "sidebar.explorer" :
    view === "providers" ? "sidebar.providers" :
    view === "mcp" ? "sidebar.mcp" :
    view === "skills" ? "sidebar.skills" :
    view === "cloner" ? "sidebar.cloner" :
    view === "gradio" ? "sidebar.gradio" :
    "sidebar.settings";

  return (
    <div className="flex h-full bg-[#252526]">
      <ActivityBar view={view} setView={setView} />
      <div className="w-64 flex flex-col border-r border-[#1e1e1e] overflow-hidden">
        <div className="panel-header">
          <span>{t(titleKey)}</span>
        </div>
        <div className="divider" />
        <div className="flex-1 overflow-y-auto">
          {view === "explorer" && (
            <ExplorerPanel
              html={props.html}
              onReset={props.onReset}
              onTemplateChange={props.onTemplateChange}
              selectedTemplateId={props.selectedTemplateId}
              selectedUI={props.selectedUI}
              selectedTools={props.selectedTools}
            />
          )}
          {view === "providers" && <ProvidersPanel />}
          {view === "mcp" && <McpPanel />}
          {view === "skills" && <SkillsPanel />}
          {view === "cloner" && (
            <ClonerPanel onClone={props.onClone} />
          )}
          {view === "gradio" && <GradioPanel />}
          {view === "settings" && (
            <SettingsPanel
              modelParams={props.modelParams}
              onModelParamsChange={props.onModelParamsChange}
              onTemplateChange={props.onTemplateChange}
              selectedTemplateId={props.selectedTemplateId}
              selectedUI={props.selectedUI}
              selectedTools={props.selectedTools}
            />
          )}
        </div>
      </div>
    </div>
  );
}
