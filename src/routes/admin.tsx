import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  Trash2,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Search,
  UserPlus,
  X,
  Key,
  Mail,
} from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const STAT_STYLES = {
  warning: {
    active: "border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]",
    iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
  },
  success: {
    active: "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
    iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  },
  destructive: {
    active: "border-rose-500/50 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.1)]",
    iconBg: "bg-rose-500/15 border-rose-500/30 text-rose-400",
  },
};

function AdminPage() {
  const currentUser = useAuth((s) => s.currentUser);
  const users = useAuth((s) => s.users);
  const approveUser = useAuth((s) => s.approveUser);
  const rejectUser = useAuth((s) => s.rejectUser);
  const deleteUser = useAuth((s) => s.deleteUser);
  const addUserDirect = useAuth((s) => s.addUserDirect);

  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<"admin" | "user">("user");
  const [addStatus, setAddStatus] = useState<"approved" | "pending" | "rejected">("approved");
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Admin authorization guard
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center glass rounded-2xl p-8 border border-destructive/20 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-destructive/50 to-transparent" />
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-destructive/10 text-destructive mb-6 border border-destructive/20">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Acesso Restrito</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Você não possui permissões administrativas para visualizar esta página.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-sm font-semibold border border-border transition"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para o Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter users with fallback status handling
  const pendingUsers = users.filter((u) => (u.status || "pending") === "pending");
  const approvedUsers = users.filter(
    (u) => (u.status || "approved") === "approved" && u.email.toLowerCase() !== currentUser.email.toLowerCase()
  );
  const rejectedUsers = users.filter((u) => u.status === "rejected");

  const handleApprove = async (email: string) => {
    await approveUser(email);
    toast.success(`Acesso aprovado com sucesso para: ${email}`);
  };

  const handleReject = async (email: string) => {
    await rejectUser(email);
    toast.warning(`Solicitação de acesso recusada para: ${email}`);
  };

  const handleDelete = async (email: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
      await deleteUser(email);
      toast.success(`Usuário excluído: ${email}`);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const res = await addUserDirect(addEmail, addPassword, addRole, addStatus);
    if (res.success) {
      toast.success(`Usuário ${addEmail} cadastrado com sucesso!`);
      setIsAddModalOpen(false);
      setAddEmail("");
      setAddPassword("");
    } else {
      setAddError(res.error || "Erro ao cadastrar usuário.");
      toast.error(res.error || "Erro ao cadastrar usuário.");
    }
  };

  const rawList =
    activeTab === "pending"
      ? pendingUsers
      : activeTab === "approved"
        ? approvedUsers
        : rejectedUsers;

  const currentList = rawList.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const tabs: { key: "pending" | "approved" | "rejected"; label: string; count: number }[] = [
    { key: "pending", label: "Pendentes", count: pendingUsers.length },
    { key: "approved", label: "Aprovados", count: approvedUsers.length },
    { key: "rejected", label: "Recusados", count: rejectedUsers.length },
  ];

  return (
    <AppShell>
      <div className="px-6 md:px-10 py-8 md:py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.24em] text-primary flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4" />
              Painel Administrativo
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              Controle de Contas
            </h1>
            <p className="text-muted-foreground max-w-xl text-sm">
              Gerencie, aprove ou recuse solicitações de acesso ao NetVision NOC.
            </p>
          </div>

          <div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:glow-cyan transition shadow-lg cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Criar Conta Direta
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: "pending" as const, label: "Solicitações Pendentes", count: pendingUsers.length, icon: Clock, styleKey: "warning" as const },
            { key: "approved" as const, label: "Usuários Aprovados", count: approvedUsers.length, icon: UserCheck, styleKey: "success" as const },
            { key: "rejected" as const, label: "Contas Recusadas", count: rejectedUsers.length, icon: UserX, styleKey: "destructive" as const },
          ].map((stat) => {
            const Icon = stat.icon;
            const style = STAT_STYLES[stat.styleKey];
            const isSelected = activeTab === stat.key;
            return (
              <motion.div
                key={stat.key}
                onClick={() => setActiveTab(stat.key)}
                whileHover={{ y: -2 }}
                className={`glass rounded-2xl p-5 border cursor-pointer transition ${
                  isSelected ? style.active : "border-border/60 hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${style.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {stat.key === "pending" && pendingUsers.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                      Atenção
                    </span>
                  )}
                </div>
                <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
                  {stat.label}
                </div>
                <div className="font-display text-3xl font-semibold mt-1">{stat.count}</div>
              </motion.div>
            );
          })}
        </div>

        {/* User list card */}
        <div className="glass rounded-2xl border border-border/60 overflow-hidden">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-border/40 bg-secondary/20 p-2 sm:px-6">
            {/* Tabs */}
            <div className="flex border-b sm:border-b-0 border-border/30">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
                    activeTab === tab.key
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        activeTab === tab.key
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="p-2 sm:p-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 rounded-xl bg-background/60 border border-border/80 text-xs focus:outline-none focus:border-primary/50 transition w-full sm:w-60"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {currentList.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="inline-grid place-items-center w-12 h-12 rounded-full bg-secondary text-muted-foreground/60">
                  <Users className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm">Nenhum usuário encontrado</div>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {searchQuery
                    ? `Nenhum usuário corresponde à busca "${searchQuery}".`
                    : activeTab === "pending"
                      ? "Não há novas solicitações de cadastro aguardando aprovação."
                      : activeTab === "approved"
                        ? "Não há outros usuários aprovados no sistema."
                        : "Nenhum usuário foi recusado."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/40 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      <th className="pb-3 px-3">E-mail do Solicitante</th>
                      <th className="pb-3 px-3">Papel</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Ações de Aprovação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {currentList.map((user) => {
                      const userStatus = user.status || "pending";
                      return (
                        <tr key={user.email} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-4 px-3 font-medium font-mono text-sm">{user.email}</td>
                          <td className="py-4 px-3 text-xs text-muted-foreground capitalize">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${user.role === "admin" ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary text-muted-foreground"}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-3">
                            {userStatus === "pending" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/30">
                                <Clock className="w-3.5 h-3.5" /> Aguardando Aprovação
                              </span>
                            )}
                            {userStatus === "approved" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                                <CheckCircle className="w-3.5 h-3.5" /> Aprovado
                              </span>
                            )}
                            {userStatus === "rejected" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/30">
                                <XCircle className="w-3.5 h-3.5" /> Recusado
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {userStatus === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleApprove(user.email)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition cursor-pointer shadow-sm"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" /> Aprovar Acesso
                                  </button>
                                  <button
                                    onClick={() => handleReject(user.email)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-semibold hover:bg-rose-500/30 transition cursor-pointer"
                                  >
                                    <UserX className="w-3.5 h-3.5" /> Recusar
                                  </button>
                                </>
                              )}
                              {userStatus === "approved" && (
                                <button
                                  onClick={() => handleReject(user.email)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground text-xs font-semibold transition cursor-pointer"
                                >
                                  Revogar Acesso
                                </button>
                              )}
                              {userStatus === "rejected" && (
                                <button
                                  onClick={() => handleApprove(user.email)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition cursor-pointer"
                                >
                                  Re-aprovar
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(user.email)}
                                className="inline-flex items-center justify-center p-2 rounded-lg bg-secondary text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                title="Excluir Usuário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Direct User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass rounded-2xl p-6 border border-border relative overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                  <UserPlus className="w-5 h-5" />
                  Criar Conta Direta
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-6">
                Cadastre um usuário com acesso pré-aprovado ou atribua permissões administrativas.
              </p>

              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                {addError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                    {addError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-secondary/40 border border-border text-sm focus:border-primary focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="Digite a senha da conta"
                    className="w-full px-3.5 py-2 rounded-xl bg-secondary/40 border border-border text-sm focus:border-primary focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                      Papel
                    </label>
                    <select
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value as "admin" | "user")}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs font-semibold focus:outline-none"
                    >
                      <option value="user">Usuário Comum</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                      Status Inicial
                    </label>
                    <select
                      value={addStatus}
                      onChange={(e) => setAddStatus(e.target.value as "approved" | "pending" | "rejected")}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs font-semibold focus:outline-none"
                    >
                      <option value="approved">Aprovado</option>
                      <option value="pending">Pendente</option>
                      <option value="rejected">Recusado</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:glow-cyan transition cursor-pointer"
                  >
                    Cadastrar Usuário
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
