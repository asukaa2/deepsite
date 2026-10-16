import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  html?: string; // for assistant messages, the rendered HTML
  timestamp: number;
  isToolEvent?: boolean;
  toolName?: string;
  toolServer?: string;
  isError?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isWorking: boolean;
  abortController: AbortController | null;
  addMessage: (m: ChatMessage) => void;
  appendToMessage: (id: string, content: string) => void;
  setWorking: (w: boolean, controller?: AbortController | null) => void;
  clear: () => void;
}

const LS_KEY = "chat_messages_v2";

function loadInitial(): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: loadInitial(),
  isWorking: false,
  abortController: null,

  addMessage: (m) => {
    const messages = [...get().messages, m];
    localStorage.setItem(LS_KEY, JSON.stringify(messages));
    set({ messages });
  },

  appendToMessage: (id, content) => {
    const messages = get().messages.map((m) =>
      m.id === id ? { ...m, content: m.content + content } : m
    );
    // Don't persist on every keystroke — too expensive. Persist only on stop.
    set({ messages });
  },

  setWorking: (w, controller = null) => {
    if (!w) {
      const messages = get().messages;
      localStorage.setItem(LS_KEY, JSON.stringify(messages));
    }
    set({ isWorking: w, abortController: controller });
  },

  clear: () => {
    localStorage.removeItem(LS_KEY);
    set({ messages: [] });
  },
}));
