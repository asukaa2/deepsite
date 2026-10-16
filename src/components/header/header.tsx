import { useTranslation } from "react-i18next";
import { TbRefresh, TbRobot } from "react-icons/tb";
import Logo from "@/assets/logo.svg";

interface TopBarProps {
  onReset: () => void;
  providerName?: string;
  modelName?: string;
  onToggleSidebar?: () => void;
  children?: React.ReactNode;
}

export default function TopBar({
  onReset,
  providerName,
  modelName,
  children,
}: TopBarProps) {
  const { t } = useTranslation();
  const short = modelName
    ? modelName.includes("/")
      ? modelName.split("/").pop()
      : modelName
    : "";

  return (
    <header className="top-bar">
      <div className="flex items-center gap-3">
        <img src={Logo} alt="DeepSite" className="w-5 h-5" />
        <span className="font-semibold text-sm tracking-tight">{t("app.title")}</span>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>·</span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("app.subtitle")}</span>
      </div>

      <div className="flex items-center gap-3">
        {providerName && modelName && (
          <div className="badge flex items-center gap-2">
            <TbRobot size={12} style={{ color: "var(--success)" }} />
            <span style={{ color: "var(--text-muted)" }}>{providerName}</span>
            <span style={{ color: "var(--text-dim)" }}>·</span>
            <span style={{ color: "var(--text)" }}>{short}</span>
          </div>
        )}
        {children}
        <button onClick={onReset} className="btn btn-ghost" title={t("header.resetTooltip")}>
          <TbRefresh size={14} />
          <span>{t("header.new")}</span>
        </button>
      </div>
    </header>
  );
}
