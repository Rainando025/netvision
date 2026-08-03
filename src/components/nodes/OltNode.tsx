import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Activity, Trash2 } from "lucide-react";
import type { OltNodeData } from "@/lib/types";
import { useDiagram } from "@/lib/store";

export function OltNode({ id, data, selected }: NodeProps) {
  const d = data as OltNodeData;
  const remove = useDiagram((s) => s.removeNode);
  const edges = useDiagram((s) => s.edges);
  const used = edges.filter((e) => e.source === id || e.target === id).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`group relative rounded-2xl glass min-w-[260px] ${selected ? "glow-cyan" : ""}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-3 px-4 pt-3.5">
        <div className="grid place-items-center w-9 h-9 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
          <Activity className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold truncate">{d.name}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">OLT / GPON</div>
        </div>
        <button
          onClick={() => remove(id)}
          className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive p-1"
          aria-label="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 pb-3 pt-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>Portas PON</span>
          <span className="font-mono text-foreground">{Math.min(used, d.ponPorts)}/{d.ponPorts}</span>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(d.ponPorts, 16)}, minmax(0,1fr))` }}>
          {Array.from({ length: d.ponPorts }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-sm ${i < used ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-secondary"}`}
              style={{ boxShadow: i < used ? undefined : "inset 0 0 0 1px var(--border)" }}
            />
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </motion.div>
  );
}
