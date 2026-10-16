import { create } from "zustand";

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon?: string;
  prompt: string;
  tags?: string[];
  mcpTools?: string[];
}

interface SkillsState {
  skills: Skill[];
  active: string[]; // active skill ids
  loaded: boolean;
  load: () => Promise<void>;
  addSkill: (skill: Skill) => Promise<void>;
  removeSkill: (id: string) => Promise<void>;
  toggle: (id: string) => void;
  isActive: (id: string) => boolean;
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],
  active: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    try {
      const res = await fetch("/api/skills");
      const data = await res.json();
      if (data.ok) set({ skills: data.skills, loaded: true });
    } catch {}
    try {
      const saved = JSON.parse(localStorage.getItem("active_skills") || "[]");
      set({ active: saved });
    } catch {}
  },

  addSkill: async (skill) => {
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message);
    await get().load();
  },

  removeSkill: async (id) => {
    await fetch(`/api/skills/${id}`, { method: "DELETE" });
    await get().load();
  },

  toggle: (id) => {
    const cur = get().active;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    localStorage.setItem("active_skills", JSON.stringify(next));
    set({ active: next });
  },

  isActive: (id) => get().active.includes(id),
}));
