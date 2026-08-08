import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LayoutDashboard, Network, Cctv, Sparkles, ShieldCheck, LogOut, Sun, Moon, Radio, Share2, Settings } from "lucide-react";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { AiAssistantDrawer } from "./AiAssistantDrawer";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/diagram", label: "Diagrama (3D)", icon: Share2 },
] as const;

const adminNav = { to: "/admin", label: "Admin", icon: ShieldCheck } as const;

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("netvision-theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
    localStorage.setItem("netvision-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggle };
}

export function AppShell({ children }: { children: ReactNode }) {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const currentUser = useAuth((s) => s.currentUser);
  const users = useAuth((s) => s.users);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const isAdmin = currentUser?.role === "admin";
  const pendingCount = users.filter((u) => (u.status || "pending") === "pending").length;

  type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
  const allNav: NavItem[] = isAdmin ? [...nav, adminNav] : [...nav];

  const handleLogout = () => {
    logout();
    toast.success("Sessão encerrada com sucesso.");
    navigate({ to: "/login" });
  };

  const isLight = theme === "light";

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 flex-col border-r border-border/60 glass">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <img src="https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/refs/heads/main/popgrid_logo_transparente.png" alt="POP GRID Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-display font-semibold tracking-tight text-lg leading-none">POP GRID</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">Network diagram system</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {allNav.map((item) => {
            const active = path === item.to;
            const Icon = item.icon;
            const isAdminLink = item.to === "/admin";
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className="relative block"
              >
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${active
                      ? "text-foreground"
                      : isAdminLink
                        ? "text-primary/70 hover:text-primary hover:bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    }`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-secondary border border-border"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon className={`relative w-4 h-4 ${isAdminLink && !active ? "text-primary/70" : ""}`} />
                  <span className="relative font-medium">{item.label}</span>
                  {active && !isAdminLink && <span className="relative ml-auto w-1.5 h-1.5 rounded-full bg-primary status-dot text-primary" />}
                  {isAdminLink && (
                    <div className="relative ml-auto flex items-center gap-1.5">
                      {pendingCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                          {pendingCount}
                        </span>
                      ) : (
                        !active && (
                          <span className="text-[9px] uppercase tracking-wider font-bold text-primary/70 border border-primary/30 bg-primary/10 rounded px-1 py-0.5">
                            ADM
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle + Session footer */}
        <div className="px-4 py-4 border-t border-border/60 space-y-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggle}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all duration-300 ${isLight
                ? "bg-amber-50 text-amber-600 border-amber-200/80 hover:bg-amber-100"
                : "bg-secondary/40 text-cyan-400 border-border/40 hover:bg-secondary/70"
              }`}
            title={isLight ? "Mudar para tema escuro" : "Mudar para tema claro"}
          >
            {isLight ? (
              <>
                <Moon className="w-4 h-4" />
                <span>Tema Escuro</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4" />
                <span>Tema Claro</span>
              </>
            )}
            {/* Animated indicator */}
            <span className={`ml-auto w-8 h-4 rounded-full flex items-center px-0.5 transition-all duration-300 ${isLight ? "bg-amber-400" : "bg-cyan-500/30 border border-cyan-500/50"}`}>
              <motion.span
                animate={{ x: isLight ? 16 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className={`w-3 h-3 rounded-full block ${isLight ? "bg-white shadow-sm" : "bg-cyan-400"}`}
              />
            </span>
          </button>

          {currentUser && (
            <div className="px-2 py-2.5 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
              <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Sessão ativa</div>
              <div className="font-mono text-xs text-foreground/90 truncate" title={currentUser.email}>
                {currentUser.email}
              </div>
              {isAdmin && (
                <div className="text-[10px] text-primary font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Administrador
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sair do sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/60 glass">
          <div className="flex items-center gap-2">
            <img src="https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/refs/heads/main/popgrid_logo_transparente.png" alt="Logo" className="w-6 h-6 object-contain" />
            <span className="font-display font-semibold">POP GRID</span>
          </div>
          <nav className="flex gap-1">
            {allNav.map((item) => {
              const Icon = item.icon;
              const active = path === item.to;
              const isAdminLink = item.to === "/admin";
              return (
                <Link key={item.to} to={item.to as any} className={`relative p-2 rounded-md ${active ? "bg-secondary text-primary" : "text-muted-foreground"}`}>
                  <Icon className="w-4 h-4" />
                  {isAdminLink && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
            {/* Mobile theme toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-md text-muted-foreground hover:text-primary transition-colors"
              title="Alternar tema"
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </header>
        {children}
      </main>

      {/* Constraints container for draggable floating button */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-30">
        {/* Floating AI assistant button (Draggable) */}
        <motion.button
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          dragMomentum={false}
          onClick={() => setIsAiOpen(true)}
          className="pointer-events-auto absolute bottom-6 right-6 w-11 h-11 rounded-full bg-primary text-primary-foreground hover:glow-cyan flex items-center justify-center transition shadow-lg cursor-grab active:cursor-grabbing group"
          title="Perguntar para o POP GRID Copilot (Arraste para mover)"
          aria-label="Pedir ajuda para IA"
        >
          <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        </motion.button>
      </div>

      {/* Side panel drawer for AI help */}
      <AiAssistantDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
}
