import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  TbCode,
  TbDeviceMobile,
  TbStack2,
} from "react-icons/tb";

interface SettingsPanelProps {
  modelParams: any;
  onModelParamsChange: (params: any) => void;
  onTemplateChange: (framework: string, ui: string | null, tools: string[]) => void;
  selectedTemplateId: string;
  selectedUI: string | null;
  selectedTools: string[];
}

export default function SettingsPanel({
  modelParams,
  onModelParamsChange,
  onTemplateChange,
  selectedTemplateId,
}: SettingsPanelProps) {
  const { t } = useTranslation();
  const [maxTokens, setMaxTokens] = useState(modelParams?.max_tokens ?? 64000);
  const [temperature, setTemperature] = useState(modelParams?.temperature ?? 0);

  const apply = () => {
    onModelParamsChange({
      ...modelParams,
      max_tokens: Number(maxTokens),
      temperature: Number(temperature),
    });
    toast.success("Settings applied");
  };

  const groups: { label: string; icon: React.ReactNode; items: { id: string; name: string }[] }[] = [
    {
      label: "Basic",
      icon: <TbCode size={14} />,
      items: [
        { id: "vanilla", name: "TailwindCSS HTML" },
        { id: "vue3", name: "Vue 3" },
      ],
    },
    {
      label: "Mobile",
      icon: <TbDeviceMobile size={14} />,
      items: [
        { id: "react-native-web", name: "React Native Web" },
        { id: "material-android", name: "Material 3 (Android)" },
      ],
    },
    {
      label: "Full-Stack",
      icon: <TbStack2 size={14} />,
      items: [
        { id: "nextjs-fullstack", name: "Next.js Full-Stack" },
        { id: "express-react", name: "Express + React" },
        { id: "mern-stack", name: "MERN Stack" },
      ],
    },
  ];

  return (
    <div className="p-3 space-y-4" style={{ color: "var(--text)" }}>
      <div>
        <div className="panel-subheader">{t("settings.templates.framework")}</div>
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="text-[11px] uppercase tracking-wider font-medium flex items-center gap-1.5 px-2 pb-1" style={{ color: "var(--text-muted)" }}>
                {g.icon}
                <span>{g.label}</span>
              </div>
              <div className="space-y-0.5">
                {g.items.map((tpl) => (
                  <div
                    key={tpl.id}
                    className={`tree-row ${selectedTemplateId === tpl.id ? "active" : ""}`}
                    onClick={() => onTemplateChange(tpl.id, null, [])}
                  >
                    <span>{tpl.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="divider" />

      <div>
        <label className="block text-xs uppercase mb-2" style={{ color: "var(--text-muted)" }}>
          {t("settings.modelParams.maxTokens")}
        </label>
        <input
          type="number"
          min={256}
          max={200000}
          value={maxTokens}
          onChange={(e) => setMaxTokens(e.target.value)}
          className="input"
        />
      </div>

      <div>
        <label className="block text-xs uppercase mb-2" style={{ color: "var(--text-muted)" }}>
          {t("settings.modelParams.temperature")}
        </label>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {temperature.toFixed(1)} ({temperature === 0 ? t("settings.modelParams.precise") : temperature >= 1.5 ? t("settings.modelParams.creative") : t("settings.modelParams.balanced")})
        </div>
      </div>

      <button onClick={apply} className="btn btn-primary w-full justify-center">
        {t("settings.applySettings")}
      </button>
    </div>
  );
}
