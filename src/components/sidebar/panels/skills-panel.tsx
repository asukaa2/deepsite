import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { TbPlus, TbTrash } from "react-icons/tb";
import { useSkillsStore } from "../../../store/skillsStore";

export default function SkillsPanel() {
  const { t } = useTranslation();
  const { skills, active, toggle, addSkill, removeSkill } = useSkillsStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", description: "", prompt: "" });

  const handleSave = async () => {
    if (!form.id || !form.prompt) {
      toast.error("id and prompt required");
      return;
    }
    try {
      await addSkill({
        id: form.id,
        name: form.name || form.id,
        description: form.description || "",
        prompt: form.prompt,
      });
      toast.success("Skill added");
      setForm({ id: "", name: "", description: "", prompt: "" });
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to add skill");
    }
  };

  return (
    <div className="p-3 text-[#cccccc] space-y-3">
      <div className="text-xs text-[#9a9a9a] uppercase">{t("skills.active")}</div>
      {active.length === 0 && (
        <div className="text-xs text-[#8a8a8a]">{t("skills.none")}</div>
      )}
      {active.map((id) => {
        const s = skills.find((x) => x.id === id);
        if (!s) return null;
        return (
          <div
            key={id}
            className="flex items-center justify-between bg-[#2d2d2d] border border-[#3c3c3c] rounded px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{s.name}</div>
              <div className="text-[11px] text-[#8a8a8a] truncate">{s.description}</div>
            </div>
            <button
              onClick={() => toggle(id)}
              className="text-[11px] bg-indigo-600 text-white px-2 py-1 rounded"
            >
              {t("skills.deactivate")}
            </button>
          </div>
        );
      })}

      <div className="divider" />

      <div className="flex items-center justify-between">
        <div className="text-xs text-[#9a9a9a] uppercase">{t("skills.available")}</div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[#9a9a9a] hover:text-white"
          title={t("skills.addCustom")}
        >
          <TbPlus size={16} />
        </button>
      </div>

      {showForm && (
        <div className="space-y-2 bg-[#2d2d2d] border border-[#3c3c3c] rounded p-3">
          <input
            placeholder={t("skills.skillName") + " (id)"}
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5"
          />
          <input
            placeholder={t("skills.skillDescription")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5"
          />
          <textarea
            placeholder={t("skills.skillPrompt")}
            value={form.prompt}
            onChange={(e) => setForm({ ...form, prompt: e.target.value })}
            rows={4}
            className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-xs rounded px-2 py-1.5 font-code"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1.5 rounded"
            >
              {t("skills.save")}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white text-xs py-1.5 rounded"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {skills
        .filter((s) => !active.includes(s.id))
        .map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between bg-[#2d2d2d] border border-[#3c3c3c] rounded px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{s.name}</div>
              <div className="text-[11px] text-[#8a8a8a] truncate">{s.description}</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggle(s.id)}
                className="text-[11px] bg-[#3c3c3c] hover:bg-indigo-600 text-white px-2 py-1 rounded"
              >
                {t("skills.activate")}
              </button>
              {!(s as any).builtin && (
                <button
                  onClick={() => removeSkill(s.id)}
                  className="text-[#9a9a9a] hover:text-red-400 p-1"
                >
                  <TbTrash size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
