import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { TbCheck, TbLoader2 } from "react-icons/tb";
import { useProvidersStore } from "../../../store/providersStore";

export default function ProvidersPanel() {
  const { t } = useTranslation();
  const { providers, current, setCurrent, configs, setConfig } = useProvidersStore();
  const [testing, setTesting] = useState(false);
  const [testedResult, setTestedResult] = useState<"ok" | "fail" | null>(null);

  const cfg = configs[current] || { apiKey: "", baseUrl: "", model: "" };
  const provider = providers.find((p) => p.id === current);

  const handleTest = async () => {
    setTesting(true);
    setTestedResult(null);
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: current,
          api_key: cfg.apiKey,
          base_url: cfg.baseUrl,
          model: cfg.model,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestedResult("ok");
        toast.success(t("providers.testOk"));
      } else {
        setTestedResult("fail");
        toast.error(data.message || t("providers.testFail"));
      }
    } catch (e: any) {
      setTestedResult("fail");
      toast.error(e.message || t("providers.testFail"));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-3 text-[#cccccc] space-y-4">
      <div>
        <label className="block text-xs uppercase text-[#9a9a9a] mb-2">
          {t("providers.selectProvider")}
        </label>
        <select
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {provider?.description && (
          <div className="text-[11px] text-[#8a8a8a] mt-1">{provider.description}</div>
        )}
      </div>

      <div>
        <label className="block text-xs uppercase text-[#9a9a9a] mb-1">
          {t("providers.apiKey")}
        </label>
        <input
          type="password"
          value={cfg.apiKey}
          onChange={(e) => setConfig(current, { apiKey: e.target.value })}
          placeholder={t("providers.apiKeyPlaceholder")}
          className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs uppercase text-[#9a9a9a] mb-1">
          {t("providers.baseUrl")}
        </label>
        <input
          type="text"
          value={cfg.baseUrl}
          onChange={(e) => setConfig(current, { baseUrl: e.target.value })}
          placeholder={provider?.base_url || "https://api.openai.com/v1"}
          className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 font-code"
        />
      </div>

      <div>
        <label className="block text-xs uppercase text-[#9a9a9a] mb-1">
          {t("providers.model")}
        </label>
        <input
          type="text"
          list={`models-${current}`}
          value={cfg.model}
          onChange={(e) => setConfig(current, { model: e.target.value })}
          placeholder={t("providers.modelPlaceholder")}
          className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 font-code"
        />
        {provider?.suggested_models && provider.suggested_models.length > 0 && (
          <datalist id={`models-${current}`}>
            {provider.suggested_models.map((m: string) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        )}
      </div>

      <button
        onClick={handleTest}
        disabled={testing || !cfg.apiKey}
        className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded"
      >
        {testing ? <TbLoader2 size={16} className="animate-spin" /> : <TbCheck size={16} />}
        {testing ? t("providers.testing") : t("providers.test")}
      </button>
      {testedResult === "ok" && (
        <div className="text-xs text-green-400 text-center">{t("providers.testOk")}</div>
      )}
      {testedResult === "fail" && (
        <div className="text-xs text-red-400 text-center">{t("providers.testFail")}</div>
      )}

      {provider?.no_auth_required && (
        <div className="text-[11px] text-[#8a8a8a] bg-[#2d2d2d] border border-[#3c3c3c] rounded p-2">
          {t("providers.noAuthRequired")}
        </div>
      )}
    </div>
  );
}
