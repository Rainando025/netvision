import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Network, Trash2 } from "lucide-react";
import type { SwitchNodeData } from "@/lib/types";
import { useDiagram } from "@/lib/store";

export function SwitchNode({ id, data, selected }: NodeProps) {
  const d = data as SwitchNodeData;
  const remove = useDiagram((s) => s.removeNode);
  const edges = useDiagram((s) => s.edges);
  const used = edges.filter((e) => e.source === id || e.target === id).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`group relative rounded-xl border-2 shadow-lg transition-all overflow-hidden ${
        selected
          ? "border-cyan-400 shadow-cyan-500/30"
          : "border-cyan-900/60 hover:border-cyan-500/60"
      }`}
      style={{
        minWidth: "260px",
        background: "linear-gradient(135deg, #072e3d 0%, #0e4c63 60%, #0891b2 100%)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-background" />
      <div className="flex items-center gap-3 px-4 py-3 border-b border-cyan-800/40" style={{ background: "rgba(8,145,178,0.2)" }}>
        <div className="grid place-items-center w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
          <Network className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-white truncate">{d.name}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300 font-medium">{d.switchType}</div>
        </div>
        <button
          onClick={() => remove(id)}
          className="opacity-0 group-hover:opacity-100 transition text-cyan-300 hover:text-red-400 p-1"
          aria-label="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 pb-3.5 pt-3">
        <div className="flex items-center justify-between text-[11px] text-cyan-200/80 mb-1.5">
          <span>Portas</span>
          <span className="font-mono text-white">{used}/{d.ports}</span>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(d.ports, 12)}, minmax(0,1fr))` }}>
          {Array.from({ length: d.ports }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-sm ${i < used ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" : "bg-cyan-950/50"}`}
              style={{ border: i < used ? undefined : "1px solid rgba(8,145,178,0.25)" }}
            />
          ))}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-background" />
    </motion.div>
  );
}
