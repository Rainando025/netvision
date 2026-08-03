import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Camera, Trash2, Activity } from "lucide-react";
import { useEffect } from "react";
import { type CameraNodeData } from "@/lib/types";
import { useDiagram } from "@/lib/store";
import { pingIpAddress } from "@/lib/api/network.functions";

export function CameraNode({ id, data, selected }: NodeProps) {
  const d = data as CameraNodeData;
  const remove = useDiagram((s) => s.removeNode);
  const updateNodeData = useDiagram((s) => s.updateNodeData);

  // Periodic real ping
  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const r = await pingIpAddress({ data: { ip: d.ip } });
        if (active) {
          updateNodeData(id, { ping: r.ping, status: r.status });
        }
      } catch (error) {
        console.error(`Erro ao pingar IP ${d.ip}:`, error);
        if (active) {
          updateNodeData(id, { ping: null, status: "offline" });
        }
      }
    };
    tick();
    const t = setInterval(tick, 5000); // 5 seconds interval for real pings to reduce network load
    return () => {
      active = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, d.ip]);

  const status = d.status ?? "offline";
  const statusColor =
    status === "online" ? "text-success" : status === "warning" ? "text-warning" : "text-destructive";
  const statusBg =
    status === "online" ? "bg-success" : status === "warning" ? "bg-warning" : "bg-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`group relative rounded-2xl glass min-w-[220px] ${selected ? "glow-accent" : ""}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-3 px-4 pt-3.5">
        <div className="grid place-items-center w-9 h-9 rounded-lg bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20">
          <Camera className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold truncate">{d.name}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{d.cameraType}</div>
        </div>
        <button
          onClick={() => remove(id)}
          className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive p-1"
          aria-label="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 py-3 mt-2 border-t border-border/60 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">IP</div>
          <div className="font-mono text-sm">{d.ip}</div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <span className={`w-2 h-2 rounded-full ${statusBg} status-dot ${statusColor}`} />
            <span className={`text-[10px] uppercase tracking-wider ${statusColor}`}>{status}</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs font-mono">
            <Activity className="w-3 h-3 text-muted-foreground" />
            <span>{status === "offline" ? "—" : `${d.ping}ms`}</span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </motion.div>
  );
}
