import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Network, Activity, ShieldCheck, ArrowUpRight, Zap, Share2, Radio, Server, HardDrive, Cpu } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useDiagram } from "@/lib/store";
import { useMemo } from "react";
import type { NodeData } from "@/lib/types";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "NetVision · NOC de Infraestrutura Telecom" },
      { name: "description", content: "Painel de operações para sua malha de equipamentos ISP: diagrama, topologia 3D e gerenciamento de infraestrutura Telecom em tempo real." },
      { property: "og:title", content: "NetVision · NOC de Infraestrutura Telecom" },
      { property: "og:description", content: "Painel e diagrama para infraestrutura de Telecom e ISP." },
    ],
  }),
  component: Dashboard,
}));

function Dashboard() {
  const nodes = useDiagram((s) => s.nodes);
  const edges = useDiagram((s) => s.edges);

  const switches = nodes.filter((n) => (n.data as NodeData).kind === "switch");
  const olts = nodes.filter((n) => (n.data as NodeData).kind === "olt");
  const racks = nodes.filter((n) => (n.data as NodeData).kind === "rack");
  const servers = nodes.filter((n) => (n.data as NodeData).kind === "server");
  const routers = nodes.filter((n) => (n.data as NodeData).kind === "router");
  const dios = nodes.filter((n) => (n.data as NodeData).kind === "dio");
  const totalDevices = nodes.filter((n) =>
    ["switch", "olt", "router", "server", "dio", "patchpanel", "inverter", "camera"].includes((n.data as NodeData).kind as string)
  );

  const health = totalDevices.length === 0 ? 100 : 100; // Placeholder

  const totalPower = useMemo(() => nodes.reduce((acc, n) => acc + ((n.data as any).powerWatts || 0), 0), [nodes]);
  const totalAmperage = useMemo(() => nodes.reduce((acc, n) => acc + ((n.data as any).amperage || 0), 0), [nodes]);

  const deviceStats = useMemo(() => [
    { kind: "switch", label: "Switches", count: switches.length, color: "text-cyan-500", bg: "bg-cyan-500/10 border-cyan-500/30" },
    { kind: "olt", label: "OLTs GPON", count: olts.length, color: "text-green-500", bg: "bg-green-500/10 border-green-500/30" },
    { kind: "router", label: "Roteadores", count: routers.length, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30" },
    { kind: "server", label: "Servidores", count: servers.length, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" },
    { kind: "rack", label: "Racks", count: racks.length, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30" },
    { kind: "dio", label: "DIOs Ópticos", count: dios.length, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/30" },
  ], [switches.length, olts.length, racks.length, servers.length, routers.length, dios.length]);

  return (
    <AppShell>
      <div className="px-6 md:px-10 py-8 md:py-10 space-y-8">
        {/* Hero */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="text-[11px] uppercase tracking-[0.24em] text-primary flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary status-dot text-primary" />
              Centro de operações Telecom
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight mt-2">
              Sua infraestrutura ISP,<br />
              <span className="text-primary">em uma única tela.</span>
            </motion.h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              Construa a topologia 3D, conecte OLTs, Racks, Switches, DIOs e monitore toda a sua infraestrutura de provedor em tempo real.
            </p>
          </div>

          <div className="flex gap-3">
            <Link to="/diagram" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:glow-cyan transition">
              Abrir diagrama <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Kpi icon={<Network className="w-4 h-4" />} label="Switches" value={switches.length} accent="primary" />
          <Kpi icon={<Radio className="w-4 h-4" />} label="OLTs GPON" value={olts.length} accent="success" />
          <Kpi icon={<Server className="w-4 h-4" />} label="Servidores" value={servers.length} accent="accent" />
          <Kpi icon={<ShieldCheck className="w-4 h-4" />} label="Saúde da Rede" value={`${health}%`} accent="success" />
          <Kpi icon={<Zap className="w-4 h-4" />} label="Consumo POP" value={`${totalPower}W / ${totalAmperage.toFixed(1)}A`} accent="accent" />
        </div>

        {/* Infrastructure overview */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Inventário de Infraestrutura</div>
                <div className="font-display text-xl mt-1">Equipamentos no diagrama</div>
              </div>
              <Link to="/diagram" className="text-xs text-primary flex items-center gap-1 hover:underline">
                Gerenciar <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {totalDevices.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {deviceStats.map((s) => (
                  <motion.div
                    key={s.kind}
                    whileHover={{ y: -2 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${s.bg} transition`}
                  >
                    <span className={`font-display text-2xl font-bold ${s.color}`}>{s.count}</span>
                    <span className="text-xs font-medium text-foreground/80">{s.label}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {edges.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Links configurados</span>
                  <span className="font-mono font-semibold text-primary">{edges.length}</span>
                </div>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6 flex flex-col">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Ações Rápidas</div>
            <div className="font-display text-xl mt-1">Comece agora</div>

            <div className="mt-5 space-y-3">
              <Action to="/diagram" icon={<HardDrive className="w-4 h-4" />} title="Montar rack 3D" desc="Adicione equipamentos e monte no rack 19&quot; virtual." />
              <Action to="/diagram" icon={<Activity className="w-4 h-4" />} title="Adicionar OLT GPON" desc="Configure OLTs, DIOs e topologia de fibra óptica." />
              <Action to="/diagram" icon={<Share2 className="w-4 h-4" />} title="Visualizador 3D" desc="Visualize sua infraestrutura ISP em 3D realista." />
              <Action to="/diagram" icon={<Zap className="w-4 h-4" />} title="Energia & Baterias" desc="Gerencie inversores, nobreaks e bancos de baterias." />
            </div>

            <div className="mt-auto pt-6 text-[11px] text-muted-foreground">
              Dados salvos localmente neste navegador.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number | string; accent: "primary" | "accent" | "success" }) {
  const map = {
    primary: "text-primary bg-primary/10 border-primary/30",
    accent: "text-accent bg-accent/10 border-accent/30",
    success: "text-success bg-success/10 border-success/30",
  } as const;
  return (
    <motion.div whileHover={{ y: -2 }} className="glass rounded-2xl p-5">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border ${map[accent]}`}>{icon}</div>
      <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-semibold mt-1">{value}</div>
    </motion.div>
  );
}

function Action({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="flex items-start gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-secondary/40 transition">
      <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary/15 text-primary border border-primary/30">{icon}</span>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto" />
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10">
      <div className="inline-grid place-items-center w-12 h-12 rounded-full bg-secondary mb-3">
        <Cpu className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="font-medium">Nenhum equipamento ainda</div>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Vá ao diagrama, adicione um Switch, OLT, Rack ou Servidor e gerencie sua infraestrutura de provedor.
      </p>
      <Link to="/diagram" className="inline-flex items-center gap-2 mt-4 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:glow-cyan transition">
        Abrir diagrama <ArrowUpRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
