import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Cctv, UserPlus, AlertCircle, Clock, ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  const register = useAuth((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      toast.error("As senhas não conferem.");
      return;
    }

    setLoading(true);

    try {
      const res = await register(email, password);
      if (res.success) {
        setIsRegistered(true);
        toast.success("Solicitação enviada com sucesso!");
      } else {
        setError(res.error || "Erro ao realizar cadastro");
        toast.error(res.error || "Erro ao realizar cadastro");
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

          {!isRegistered ? (
            <>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Criar nova conta
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
                    placeholder="seu-email@exemplo.com"
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
                    placeholder="Crie uma senha forte"
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/80 focus:border-primary/50 focus:outline-none transition font-medium placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    Confirmar Senha
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    disabled={loading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha criada"
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/80 focus:border-primary/50 focus:outline-none transition font-medium placeholder:text-muted-foreground/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:glow-cyan transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {loading ? "Processando..." : "Solicitar Acesso"}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-border/40 text-center">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition font-medium">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Voltar para o login
                </Link>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-6"
            >
              <div className="inline-grid place-items-center w-16 h-16 rounded-full bg-warning/15 text-warning border border-warning/30 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight">Cadastro Recebido!</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                  Sua conta foi registrada com sucesso sob o e-mail:
                </p>
                <div className="mt-2 px-3 py-1.5 rounded-lg bg-secondary font-mono text-sm inline-block border border-border">
                  {email}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-warning/5 border border-warning/10 text-xs text-warning/90 leading-relaxed max-w-sm mx-auto">
                <strong>Importante:</strong> Todo novo cadastro precisa de aprovação do administrador do sistema antes de conseguir acessar o painel.
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-sm font-semibold transition cursor-pointer"
              >
                Voltar para o Login
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
