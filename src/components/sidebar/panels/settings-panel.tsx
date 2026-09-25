import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

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

  const templates = [
    { id: "vanilla", name: "TailwindCSS HTML" },
    { id: "vue3", name: "Vue 3" },
  ];

  return (
    <div className="p-3 text-[#cccccc] space-y-4">
      <div>
        <label className="block text-xs uppercase text-[#9a9a9a] mb-2">
          {t("settings.templates.framework")}
        </label>
        <div className="space-y-1">
          {templates.map((tpl) => (
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

      <div className="divider" />

      <div>
        <label className="block text-xs uppercase text-[#9a9a9a] mb-1">
          {t("settings.modelParams.maxTokens")}
        </label>
        <input
          type="number"
          min={256}
          max={200000}
          value={maxTokens}
          onChange={(e) => setMaxTokens(e.target.value)}
          className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5"
        />
      </div>

      <div>
        <label className="block text-xs uppercase text-[#9a9a9a] mb-1">
          {t("settings.modelParams.temperature")}
        </label>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="text-xs text-[#9a9a9a] mt-1">
          {temperature.toFixed(1)} ({temperature === 0 ? t("settings.modelParams.precise") : temperature >= 1.5 ? t("settings.modelParams.creative") : t("settings.modelParams.balanced")})
        </div>
      </div>

      <button
        onClick={apply}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded"
      >
        {t("settings.applySettings")}
      </button>
    </div>
  );
}
