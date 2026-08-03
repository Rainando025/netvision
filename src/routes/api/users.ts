import { createFileRoute } from "@tanstack/react-router";
import { supabase, type UserAccount } from "@/lib/supabase";

const DEFAULT_ADMIN: UserAccount = {
  email: "alvesjuliocesar173@gmail.com",
  role: "admin",
  status: "approved",
  passwordHash: "julio123",
};

// Global in-memory fallback store on server if Supabase credentials are missing
let globalServerUsers: UserAccount[] = [DEFAULT_ADMIN];

async function fetchAllUsers(): Promise<UserAccount[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (!error && data && data.length > 0) {
        return data.map((u: any) => ({
          email: String(u.email || "").trim().toLowerCase(),
          role: (u.role as "admin" | "user") || "user",
          status: (u.status as "approved" | "pending" | "rejected") || "pending",
          passwordHash: String(u.password_hash || u.passwordHash || ""),
        }));
      }
    } catch (err) {
      console.error("[users api] error fetching from supabase:", err);
    }
  }

  // Ensure default admin exists in fallback
  if (!globalServerUsers.some((u) => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase())) {
    globalServerUsers.unshift(DEFAULT_ADMIN);
  }

  return globalServerUsers;
}

export const Route = createFileRoute("/api/users")({
  server: {
    handlers: {
      GET: async () => {
        const users = await fetchAllUsers();
        return new Response(JSON.stringify({ users }), {
          headers: { "Content-Type": "application/json" },
        });
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { action, email, password, role, status } = body || {};

          const cleanEmail = String(email || "").trim().toLowerCase();
          if (!cleanEmail && action !== "list") {
            return new Response(
              JSON.stringify({ success: false, error: "E-mail é obrigatório." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "register" || action === "addDirect") {
            if (!password) {
              return new Response(
                JSON.stringify({ success: false, error: "Senha é obrigatória." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const currentUsers = await fetchAllUsers();
            const exists = currentUsers.some(
              (u) => u.email.toLowerCase() === cleanEmail
            );

            if (exists) {
              return new Response(
                JSON.stringify({ success: false, error: "Este e-mail já está cadastrado." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const userRole = role === "admin" ? "admin" : "user";
            const userStatus = action === "addDirect" ? status || "approved" : "pending";

            const newUser: UserAccount = {
              email: cleanEmail,
              role: userRole,
              status: userStatus,
              passwordHash: password,
            };

            // Save to Supabase if configured
            if (supabase) {
              const { error: dbError } = await supabase.from("users").insert([
                {
                  email: cleanEmail,
                  password_hash: password,
                  role: userRole,
                  status: userStatus,
                },
              ]);
              if (dbError) {
                console.error("[users api] Supabase insert error:", dbError);
              }
            }

            // Save to server fallback store
            globalServerUsers = [
              ...globalServerUsers.filter((u) => u.email.toLowerCase() !== cleanEmail),
              newUser,
            ];

            return new Response(
              JSON.stringify({ success: true, user: newUser, users: globalServerUsers }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "approve") {
            if (supabase) {
              await supabase
                .from("users")
                .update({ status: "approved" })
                .eq("email", cleanEmail);
            }

            globalServerUsers = globalServerUsers.map((u) =>
              u.email.toLowerCase() === cleanEmail ? { ...u, status: "approved" as const } : u
            );

            return new Response(
              JSON.stringify({ success: true, users: globalServerUsers }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "reject") {
            if (supabase) {
              await supabase
                .from("users")
                .update({ status: "rejected" })
                .eq("email", cleanEmail);
            }

            globalServerUsers = globalServerUsers.map((u) =>
              u.email.toLowerCase() === cleanEmail ? { ...u, status: "rejected" as const } : u
            );

            return new Response(
              JSON.stringify({ success: true, users: globalServerUsers }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "delete") {
            if (supabase) {
              await supabase.from("users").delete().eq("email", cleanEmail);
            }

            globalServerUsers = globalServerUsers.filter(
              (u) => u.email.toLowerCase() !== cleanEmail
            );

            return new Response(
              JSON.stringify({ success: true, users: globalServerUsers }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          const currentUsers = await fetchAllUsers();
          return new Response(JSON.stringify({ users: currentUsers }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[users api] error:", err);
          return new Response(
            JSON.stringify({ success: false, error: "Erro interno no servidor." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
