import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Cctv, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = login(email, password);
      if (res.success) {
        toast.success("Login realizado com sucesso!");
        navigate({ to: "/" });
      } else {
        setError(res.error || "Erro ao fazer login");
        toast.error(res.error || "Erro ao fazer login");
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado.");
      toast.error("Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="relative grid place-items-center w-14 h-14 rounded-2xl glow-cyan bg-card mb-4 border border-primary/20">
            <Cctv className="w-7 h-7 text-primary" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success status-dot text-success" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">NetVision</h1>
          <p className="text-sm text-muted-foreground mt-1">CCTV NOC & Network Dashboard</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-border/80 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" />
            Acesse o sistema
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-2.5 p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/80 focus:border-primary/50 focus:outline-none transition font-medium placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/80 focus:border-primary/50 focus:outline-none transition font-medium placeholder:text-muted-foreground/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:glow-cyan transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? "Carregando..." : "Entrar no Painel"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/40 text-center">
            <span className="text-xs text-muted-foreground">
              Não tem acesso?{" "}
              <Link to="/register" className="text-primary hover:underline font-semibold transition">
                Solicitar conta
              </Link>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
