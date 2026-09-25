import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  TbCheck,
  TbLoader2,
  TbPlus,
  TbTrash,
  TbX,
  TbEdit,
  TbServer,
} from "react-icons/tb";
import { useProvidersStore } from "../../../store/providersStore";

const FORMATS: Array<"openai" | "anthropic" | "gemini"> = [
  "openai",
  "anthropic",
  "gemini",
];

const emptyForm = {
  id: "",
  name: "",
  base_url: "",
  format: "openai" as "openai" | "anthropic" | "gemini",
  description: "",
  auth_header: "Authorization",
  auth_prefix: "Bearer ",
  no_auth_required: false,
  suggested_models: [] as string[],
};

export default function ProvidersPanel() {
  const { t } = useTranslation();
  const {
    providers,
    current,
    configs,
    setConfig,
    setCurrent,
    addCustomProvider,
    updateCustomProvider,
    removeCustomProvider,
    addCustomModel,
    removeCustomModel,
  } = useProvidersStore();

  const [testing, setTesting] = useState(false);
  const [testedResult, setTestedResult] = useState<"ok" | "fail" | null>(null);

  // New custom provider form state
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(emptyForm);
  // For editing the list of suggested_models inside the form
  const [modelInput, setModelInput] = useState("");

  // For the inline "add model to current provider" UI
  const [newModel, setNewModel] = useState("");

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

  const resetForm = () => {
    setForm(emptyForm);
    setModelInput("");
    setEditMode(false);
    setShowForm(false);
  };

  const startEdit = (p: any) => {
    setForm({
      id: p.id,
      name: p.name,
      base_url: p.base_url,
      format: p.format,
      description: p.description || "",
      auth_header: p.auth_header || "Authorization",
      auth_prefix: p.auth_prefix === undefined ? "Bearer " : p.auth_prefix,
      no_auth_required: !!p.no_auth_required,
      suggested_models: [...(p.suggested_models || [])],
    });
    setEditMode(true);
    setShowForm(true);
  };

  const addModelToForm = () => {
    const m = modelInput.trim();
    if (!m) return;
    if (!form.suggested_models.includes(m)) {
      setForm({ ...form, suggested_models: [...form.suggested_models, m] });
    }
    setModelInput("");
  };

  const removeModelFromForm = (m: string) => {
    setForm({
      ...form,
      suggested_models: form.suggested_models.filter((x) => x !== m),
    });
  };

  const handleSaveCustomProvider = async () => {
    try {
      if (editMode) {
        // Don't allow changing the id during edit
        const { id, ...patch } = form;
        await updateCustomProvider(form.id, patch);
        toast.success(t("providers.updated"));
      } else {
        await addCustomProvider(form);
        toast.success(t("providers.added"));
      }
      resetForm();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRemoveCustom = async (id: string) => {
    if (!window.confirm(t("providers.confirmDelete"))) return;
    try {
      await removeCustomProvider(id);
      toast.success(t("providers.deleted"));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddModel = async () => {
    const m = newModel.trim();
    if (!m || !provider) return;
    try {
      await addCustomModel(current, m);
      setNewModel("");
      toast.success(t("providers.modelAdded"));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRemoveModel = async (m: string) => {
    // Only allow removing models that the user added (custom ones).
    // Built-in models come from PROVIDER_MODELS in the backend and are not
    // in the custom_models.json file, so removing them is a no-op.
    try {
      await removeCustomModel(current, m);
      toast.success(t("providers.modelRemoved"));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-3 text-[#cccccc] space-y-4">
      {/* Top action: add a new custom provider */}
      <button
        onClick={() => {
          setForm(emptyForm);
          setEditMode(false);
          setShowForm(true);
        }}
        className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded"
      >
        <TbPlus size={16} />
        {t("providers.addCustom")}
      </button>

      {/* Custom provider form */}
      {showForm && (
        <div className="space-y-3 bg-[#2d2d2d] border border-[#3c3c3c] rounded p-3">
          <div className="text-xs uppercase text-[#9a9a9a] flex items-center gap-1">
            <TbServer size={12} />
            {editMode ? t("providers.editCustom") : t("providers.addCustom")}
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#9a9a9a] mb-0.5">
              {t("providers.id")}
            </label>
            <input
              type="text"
              value={form.id}
              disabled={editMode}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              placeholder="my-provider"
              className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5 font-code disabled:opacity-50"
            />
            {!editMode && (
              <div className="text-[10px] text-[#7a7a7a] mt-0.5">
                {t("providers.idHint")}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#9a9a9a] mb-0.5">
              {t("providers.name")}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My Custom Provider"
              className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#9a9a9a] mb-0.5">
              {t("providers.baseUrl")}
            </label>
            <input
              type="text"
              value={form.base_url}
              onChange={(e) => setForm({ ...form, base_url: e.target.value })}
              placeholder="https://api.example.com/v1"
              className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5 font-code"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#9a9a9a] mb-0.5">
              {t("providers.format")}
            </label>
            <select
              value={form.format}
              onChange={(e) =>
                setForm({ ...form, format: e.target.value as any })
              }
              className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#9a9a9a] mb-0.5">
              {t("providers.description")}
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t("providers.descriptionPlaceholder")}
              className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase text-[#9a9a9a] mb-0.5">
                {t("providers.authHeader")}
              </label>
              <input
                type="text"
                value={form.auth_header}
                onChange={(e) =>
                  setForm({ ...form, auth_header: e.target.value })
                }
                className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-xs rounded px-2 py-1.5 font-code"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-[#9a9a9a] mb-0.5">
                {t("providers.authPrefix")}
              </label>
              <input
                type="text"
                value={form.auth_prefix}
                onChange={(e) =>
                  setForm({ ...form, auth_prefix: e.target.value })
                }
                className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-xs rounded px-2 py-1.5 font-code"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={form.no_auth_required}
              onChange={(e) =>
                setForm({ ...form, no_auth_required: e.target.checked })
              }
              className="accent-indigo-500"
            />
            {t("providers.noAuthRequired")}
          </label>

          {/* Suggested models inside the form (custom providers can ship with
              an initial list; built-in providers can be augmented live below) */}
          <div>
            <label className="block text-[10px] uppercase text-[#9a9a9a] mb-1">
              {t("providers.suggestedModels")}
            </label>
            <div className="flex gap-1">
              <input
                type="text"
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addModelToForm();
                  }
                }}
                placeholder={t("providers.modelPlaceholder")}
                className="flex-1 bg-[#3c3c3c] border border-[#4c4c4c] text-white text-xs rounded px-2 py-1.5 font-code"
              />
              <button
                onClick={addModelToForm}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 rounded text-xs"
              >
                <TbPlus size={14} />
              </button>
            </div>
            {form.suggested_models.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.suggested_models.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 text-[11px] bg-[#3c3c3c] border border-[#4c4c4c] text-white rounded px-1.5 py-0.5"
                  >
                    <span className="font-code">{m}</span>
                    <button
                      onClick={() => removeModelFromForm(m)}
                      className="text-[#9a9a9a] hover:text-red-400"
                    >
                      <TbX size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSaveCustomProvider}
              disabled={!form.id || !form.name}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs py-1.5 rounded"
            >
              {editMode ? t("common.save") : t("providers.add")}
            </button>
            <button
              onClick={resetForm}
              className="px-3 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white text-xs py-1.5 rounded"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="divider" />

      {/* Provider selector */}
      <div>
        <label className="block text-xs uppercase text-[#9a9a9a] mb-2">
          {t("providers.selectProvider")}
        </label>
        <div className="relative">
          <select
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 appearance-none pr-8"
          >
            <optgroup label={t("providers.builtin")}>
              {providers
                .filter((p) => !p.custom)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </optgroup>
            {providers.some((p) => p.custom) && (
              <optgroup label={t("providers.customOptGroup")}>
                {providers
                  .filter((p) => p.custom)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
          {provider?.custom && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex gap-1">
              <button
                onClick={() => startEdit(provider)}
                title={t("providers.edit")}
                className="text-[#9a9a9a] hover:text-white"
              >
                <TbEdit size={14} />
              </button>
              <button
                onClick={() => handleRemoveCustom(provider.id)}
                title={t("providers.delete")}
                className="text-[#9a9a9a] hover:text-red-400"
              >
                <TbTrash size={14} />
              </button>
            </div>
          )}
        </div>
        {provider?.description && (
          <div className="text-[11px] text-[#8a8a8a] mt-1">
            {provider.description}
          </div>
        )}
        {provider?.custom && (
          <div className="text-[10px] text-indigo-400 mt-0.5">
            {t("providers.customBadge")}
          </div>
        )}
      </div>

      {/* Per-provider credentials */}
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

      {/* Model picker + custom model chips */}
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

        {/* Inline add-model-to-current-provider */}
        <div className="flex gap-1 mt-1">
          <input
            type="text"
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddModel();
              }
            }}
            placeholder={t("providers.addModelPlaceholder")}
            className="flex-1 bg-[#3c3c3c] border border-[#4c4c4c] text-white text-xs rounded px-2 py-1 font-code"
          />
          <button
            onClick={handleAddModel}
            disabled={!newModel.trim()}
            title={t("providers.addModel")}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-2 rounded text-xs"
          >
            <TbPlus size={14} />
          </button>
        </div>

        {/* List of suggested models as removable chips */}
        {provider?.suggested_models && provider.suggested_models.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 max-h-32 overflow-y-auto">
            {provider.suggested_models.map((m: string) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 text-[11px] bg-[#2d2d2d] border border-[#3c3c3c] text-white rounded px-1.5 py-0.5"
              >
                <span className="font-code">{m}</span>
                <button
                  onClick={() => handleRemoveModel(m)}
                  title={t("providers.removeModel")}
                  className="text-[#9a9a9a] hover:text-red-400"
                >
                  <TbX size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleTest}
        disabled={testing || (!cfg.apiKey && !provider?.no_auth_required)}
        className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded"
      >
        {testing ? (
          <TbLoader2 size={16} className="animate-spin" />
        ) : (
          <TbCheck size={16} />
        )}
        {testing ? t("providers.testing") : t("providers.test")}
      </button>
      {testedResult === "ok" && (
        <div className="text-xs text-green-400 text-center">
          {t("providers.testOk")}
        </div>
      )}
      {testedResult === "fail" && (
        <div className="text-xs text-red-400 text-center">
          {t("providers.testFail")}
        </div>
      )}

      {provider?.no_auth_required && (
        <div className="text-[11px] text-[#8a8a8a] bg-[#2d2d2d] border border-[#3c3c3c] rounded p-2">
          {t("providers.noAuthRequired")}
        </div>
      )}
    </div>
  );
}
