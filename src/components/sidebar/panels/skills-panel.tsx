import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  TbPlus,
  TbTrash,
  TbBolt,
  TbSearch,
  TbCircleCheck,
} from "react-icons/tb";
import { useSkillsStore } from "../../../store/skillsStore";

export default function SkillsPanel() {
  const { t } = useTranslation();
  const { skills, active, toggle, addSkill, removeSkill } = useSkillsStore();
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
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

  const filtered = skills.filter(
    (s) =>
      !query ||
      s.id.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-3 space-y-3" style={{ color: "var(--text)" }}>
      {/* Search */}
      <div className="relative">
        <TbSearch
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-dim)" }}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills…"
          className="input pl-8"
        />
      </div>

      {/* Active skills */}
      <div>
        <div className="panel-subheader flex items-center justify-between">
          <span>{t("skills.active")}</span>
          {active.length > 0 && (
            <span className="badge" style={{ padding: "1px 6px", fontSize: 10 }}>
              {active.length}
            </span>
          )}
        </div>
        {active.length === 0 && (
          <div className="px-4 py-2 text-xs" style={{ color: "var(--text-dim)" }}>
            {t("skills.none")}
          </div>
        )}
        {active.map((id) => {
          const s = skills.find((x) => x.id === id);
          if (!s) return null;
          return (
            <div
              key={id}
              className="flex items-center justify-between mx-2 my-1 px-3 py-2 rounded-lg"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate flex items-center gap-1.5">
                  <TbCircleCheck size={13} style={{ color: "var(--success)" }} />
                  <span style={{ color: "var(--text)" }}>{s.name}</span>
                </div>
                <div className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {s.description}
                </div>
                <div className="text-[10px] font-code mt-0.5" style={{ color: "var(--text-dim)" }}>
                  /{s.id}
                </div>
              </div>
              <button
                onClick={() => toggle(id)}
                className="btn btn-ghost"
                style={{ padding: "4px 8px", fontSize: 11 }}
              >
                {t("skills.deactivate")}
              </button>
            </div>
          );
        })}
      </div>

      <div className="divider" />

      {/* Available skills */}
      <div>
        <div className="panel-subheader flex items-center justify-between">
          <span>{t("skills.available")}</span>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-ghost"
            style={{ padding: "2px 6px" }}
            title={t("skills.addCustom")}
          >
            <TbPlus size={14} />
          </button>
        </div>

        {showForm && (
          <div className="m-2 p-3 rounded-lg space-y-2" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <input
              placeholder={t("skills.skillName") + " (id, e.g. ui-review)"}
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              className="input"
            />
            <input
              placeholder={t("skills.skillDescription")}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
            />
            <textarea
              placeholder={t("skills.skillPrompt")}
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={4}
              className="textarea font-code"
              style={{ fontSize: 12 }}
            />
            <div className="flex gap-2">
              <button onClick={handleSave} className="btn btn-primary flex-1">
                {t("skills.save")}
              </button>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}

        {filtered
          .filter((s) => !active.includes(s.id))
          .map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between mx-2 my-1 px-3 py-2 rounded-lg"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm flex items-center gap-1.5">
                  <TbBolt size={13} style={{ color: "var(--text-muted)" }} />
                  <span style={{ color: "var(--text)" }}>{s.name}</span>
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {s.description}
                </div>
                <div className="text-[10px] font-code mt-0.5" style={{ color: "var(--text-dim)" }}>
                  /{s.id}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => toggle(s.id)}
                  className="btn btn-secondary"
                  style={{ padding: "3px 8px", fontSize: 11 }}
                >
                  {t("skills.activate")}
                </button>
                {!(s as any).builtin && (
                  <button
                    onClick={() => removeSkill(s.id)}
                    className="btn btn-ghost"
                    style={{ padding: "4px", color: "var(--text-muted)" }}
                  >
                    <TbTrash size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      <div className="divider" />

      <div className="px-3 py-2 text-[11px]" style={{ color: "var(--text-dim)" }}>
        <div className="flex items-center gap-1.5 mb-1">
          <TbBolt size={12} />
          <span className="font-medium">Slash commands</span>
        </div>
        <p>
          Type <code style={{ fontFamily: "var(--font-code, monospace)", background: "var(--bg-elevated)", padding: "1px 4px", borderRadius: 3 }}>/</code> in the chat to browse and activate skills. Active skills inject directives into the system prompt.
        </p>
      </div>
    </div>
  );
}
