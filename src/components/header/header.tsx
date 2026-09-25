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
    <header className="bg-[#1f1f1f] border-b border-[#2d2d30] px-3 py-1.5 flex items-center justify-between flex-none h-9">
      <div className="flex items-center gap-3 text-white">
        <img src={Logo} alt="DeepSite" className="w-5 h-5" />
        <span className="font-semibold text-sm">{t("app.title")}</span>
        <span className="text-[#3c3c3c]">|</span>
        <span className="text-xs text-[#9a9a9a]">{t("app.subtitle")}</span>
      </div>

      <div className="flex items-center gap-3">
        {providerName && modelName && (
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
            <TbRobot size={12} />
            <span className="text-[#bbb]">{providerName}</span>
            <span className="text-[#3c3c3c]">·</span>
            <span>{short}</span>
          </div>
        )}
        {children}
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-[#bbb] bg-[#3a3a3a] hover:bg-[#4a4a4a] px-2 py-1 rounded"
          title={t("header.resetTooltip")}
        >
          <TbRefresh size={12} />
          {t("header.new")}
        </button>
      </div>
    </header>
  );
}
