import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UIMessage } from "ai";

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
}

interface ChatState {
  threads: ChatThread[];
  createThread: (id?: string) => ChatThread;
  renameThread: (id: string, title: string) => void;
  deleteThread: (id: string) => void;
  setMessages: (id: string, messages: UIMessage[]) => void;
  getThread: (id: string) => ChatThread | undefined;
}

function newId() {
  return `thr_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: [],
      createThread: (id) => {
        const thread: ChatThread = {
          id: id ?? newId(),
          title: "Nova conversa",
          updatedAt: Date.now(),
          messages: [],
        };
        set((s) => ({ threads: [thread, ...s.threads] }));
        return thread;
      },
      renameThread: (id, title) =>
        set((s) => ({
          threads: s.threads.map((t) => (t.id === id ? { ...t, title, updatedAt: Date.now() } : t)),
        })),
      deleteThread: (id) =>
        set((s) => ({ threads: s.threads.filter((t) => t.id !== id) })),
      setMessages: (id, messages) =>
        set((s) => {
          const next = s.threads.map((t) =>
            t.id === id
              ? {
                  ...t,
                  messages,
                  updatedAt: Date.now(),
                  title:
                    t.title === "Nova conversa" && messages[0]
                      ? deriveTitle(messages[0])
                      : t.title,
                }
              : t
          );
          // Move updated thread to top
          next.sort((a, b) => b.updatedAt - a.updatedAt);
          return { threads: next };
        }),
      getThread: (id) => get().threads.find((t) => t.id === id),
    }),
    {
      name: "netvision-chat",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as never))),
    }
  )
);

function deriveTitle(msg: UIMessage): string {
  const text = msg.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
  if (!text) return "Nova conversa";
  return text.length > 48 ? text.slice(0, 48) + "…" : text;
}
