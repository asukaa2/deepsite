import { useTranslation } from "react-i18next";
import {
  TbFile,
  TbServer,
  TbPlugConnected,
  TbBolt,
  TbCopy,
  TbSettings,
  TbBrandGithub,
} from "react-icons/tb";

export type SidebarView =
  | "explorer"
  | "providers"
  | "mcp"
  | "skills"
  | "cloner"
  | "settings";

interface ActivityBarProps {
  view: SidebarView;
  setView: (v: SidebarView) => void;
}

export default function ActivityBar({ view, setView }: ActivityBarProps) {
  const { t } = useTranslation();
  const items: { id: SidebarView; icon: React.ReactNode; label: string }[] = [
    { id: "explorer", icon: <TbFile size={20} />, label: t("sidebar.explorer") },
    { id: "providers", icon: <TbServer size={20} />, label: t("sidebar.providers") },
    { id: "mcp", icon: <TbPlugConnected size={20} />, label: t("sidebar.mcp") },
    { id: "skills", icon: <TbBolt size={20} />, label: t("sidebar.skills") },
    { id: "cloner", icon: <TbCopy size={20} />, label: t("sidebar.cloner") },
    { id: "settings", icon: <TbSettings size={20} />, label: t("sidebar.settings") },
  ];

  return (
    <div className="activity-bar">
      <div className="flex flex-col">
        {items.map((item) => (
          <button
            key={item.id}
            className={`activity-icon ${view === item.id ? "active" : ""}`}
            title={item.label}
            onClick={() => setView(item.id)}
          >
            {item.icon}
          </button>
        ))}
      </div>
      <a
        href="https://github.com/asukaa2/deepsite"
        target="_blank"
        rel="noopener noreferrer"
        className="activity-icon"
        title="GitHub"
      >
        <TbBrandGithub size={20} />
      </a>
    </div>
  );
}
