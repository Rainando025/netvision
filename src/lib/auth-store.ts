import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface User {
  email: string;
  role: "admin" | "user";
  status: "approved" | "pending" | "rejected";
  passwordHash: string;
}

interface AuthState {
  users: User[];
  currentUser: User | null;
  syncUsers: () => Promise<void>;
  login: (email: string, passwordHash: string) => { success: boolean; error?: string };
  register: (email: string, passwordHash: string) => Promise<{ success: boolean; error?: string }>;
  addUserDirect: (email: string, password: string, role?: "admin" | "user", status?: "approved" | "pending" | "rejected") => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  approveUser: (email: string) => Promise<void>;
  rejectUser: (email: string) => Promise<void>;
  deleteUser: (email: string) => Promise<void>;
}

const DEFAULT_ADMIN: User = {
  email: "alvesjuliocesar173@gmail.com",
  role: "admin",
  status: "approved",
  passwordHash: "julio123",
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [DEFAULT_ADMIN],
      currentUser: null,

      syncUsers: async () => {
        if (typeof window === "undefined") return;
        try {
          const res = await fetch("/api/users");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.users) && data.users.length > 0) {
              set({ users: data.users });
            }
          }
        } catch (err) {
          console.error("[auth-store] error syncing users:", err);
        }
      },

      login: (email, password) => {
        const cleanEmail = email.trim().toLowerCase();
        const user = get().users.find((u) => u.email.toLowerCase() === cleanEmail);

        if (!user) {
          return { success: false, error: "Usuário não encontrado." };
        }

        if (user.passwordHash !== password) {
          return { success: false, error: "Senha incorreta." };
        }

        const userStatus = user.status || "approved";

        if (userStatus === "pending") {
          return { success: false, error: "Aguardando aprovação do administrador para acessar o sistema." };
        }

        if (userStatus === "rejected") {
          return { success: false, error: "Sua solicitação de acesso foi recusada pelo administrador." };
        }

        set({ currentUser: user });
        return { success: true };
      },

      register: async (email, password) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !password) {
          return { success: false, error: "E-mail e senha são obrigatórios." };
        }

        try {
          const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "register", email: cleanEmail, password }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            return { success: false, error: data.error || "Erro ao realizar cadastro." };
          }

          if (Array.isArray(data.users)) {
            set({ users: data.users });
          } else {
            set((state) => ({
              users: [
                ...state.users.filter((u) => u.email.toLowerCase() !== cleanEmail),
                data.user,
              ],
            }));
          }

          return { success: true };
        } catch (err) {
          console.error("[auth-store] register error:", err);

          // Fallback to local store if offline
          const exists = get().users.some((u) => u.email.toLowerCase() === cleanEmail);
          if (exists) {
            return { success: false, error: "Este e-mail já está cadastrado." };
          }

          const newUser: User = {
            email: cleanEmail,
            role: "user",
            status: "pending",
            passwordHash: password,
          };

          set((state) => ({ users: [...state.users, newUser] }));
          return { success: true };
        }
      },

      addUserDirect: async (email, password, role = "user", status = "approved") => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !password) {
          return { success: false, error: "E-mail e senha são obrigatórios." };
        }

        try {
          const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "addDirect", email: cleanEmail, password, role, status }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            return { success: false, error: data.error || "Erro ao adicionar usuário." };
          }

          if (Array.isArray(data.users)) {
            set({ users: data.users });
          }
          return { success: true };
        } catch (err) {
          const newUser: User = {
            email: cleanEmail,
            role,
            status,
            passwordHash: password,
          };
          set((state) => ({ users: [...state.users, newUser] }));
          return { success: true };
        }
      },

      logout: () => {
        set({ currentUser: null });
      },

      approveUser: async (email) => {
        const cleanEmail = email.trim().toLowerCase();
        try {
          const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "approve", email: cleanEmail }),
          });
          const data = await res.json();
          if (Array.isArray(data.users)) {
            set({ users: data.users });
          }
        } catch (err) {
          console.error("[auth-store] approve error:", err);
        }

        set((state) => {
          const updatedUsers = state.users.map((u) =>
            u.email.trim().toLowerCase() === cleanEmail ? { ...u, status: "approved" as const } : u
          );
          const updatedCurrentUser =
            state.currentUser?.email.trim().toLowerCase() === cleanEmail
              ? { ...state.currentUser, status: "approved" as const }
              : state.currentUser;
          return { users: updatedUsers, currentUser: updatedCurrentUser };
        });
      },

      rejectUser: async (email) => {
        const cleanEmail = email.trim().toLowerCase();
        try {
          const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reject", email: cleanEmail }),
          });
          const data = await res.json();
          if (Array.isArray(data.users)) {
            set({ users: data.users });
          }
        } catch (err) {
          console.error("[auth-store] reject error:", err);
        }

        set((state) => {
          const updatedUsers = state.users.map((u) =>
            u.email.trim().toLowerCase() === cleanEmail ? { ...u, status: "rejected" as const } : u
          );
          const updatedCurrentUser =
            state.currentUser?.email.trim().toLowerCase() === cleanEmail ? null : state.currentUser;
          return { users: updatedUsers, currentUser: updatedCurrentUser };
        });
      },

      deleteUser: async (email) => {
        const cleanEmail = email.trim().toLowerCase();
        try {
          const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", email: cleanEmail }),
          });
          const data = await res.json();
          if (Array.isArray(data.users)) {
            set({ users: data.users });
          }
        } catch (err) {
          console.error("[auth-store] delete error:", err);
        }

        set((state) => {
          const updatedUsers = state.users.filter((u) => u.email.trim().toLowerCase() !== cleanEmail);
          const updatedCurrentUser =
            state.currentUser?.email.trim().toLowerCase() === cleanEmail ? null : state.currentUser;
          return { users: updatedUsers, currentUser: updatedCurrentUser };
        });
      },
    }),
    {
      name: "netvision-auth",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as never))),
      onRehydrateStorage: () => (state) => {
        if (state && (!state.users || state.users.length === 0 || !state.users.some(u => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()))) {
          state.users = [DEFAULT_ADMIN, ...(state.users || [])];
        }
        if (state?.syncUsers) {
          state.syncUsers();
        }
      },
      migrate: (persistedState: any) => {
        const state = persistedState as AuthState;
        if (state && (!state.users || state.users.length === 0 || !state.users.some(u => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()))) {
          state.users = [DEFAULT_ADMIN, ...(state.users || [])];
        }
        return state;
      },
    }
  )
);

// Periodic background sync across browsers and devices
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "netvision-auth") {
      useAuth.persist.rehydrate();
    }
  });

  // Initial sync & periodic polling every 4 seconds
  setTimeout(() => {
    useAuth.getState().syncUsers();
  }, 1000);
  setInterval(() => {
    useAuth.getState().syncUsers();
  }, 4000);
}
