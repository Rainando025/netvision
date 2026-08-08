import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Network, Trash2 } from "lucide-react";
import type { DioNodeData } from "@/lib/types";
import { useDiagram } from "@/lib/store";

export function DioNode({ id, data, selected }: NodeProps) {
  const d = data as DioNodeData;
  const remove = useDiagram((s) => s.removeNode);
  const edges = useDiagram((s) => s.edges);
  const used = edges.filter((e) => e.source === id || e.target === id).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`group relative rounded-xl border-2 shadow-lg transition-all overflow-hidden ${
        selected
          ? "border-indigo-400 shadow-indigo-500/30"
          : "border-indigo-900/60 hover:border-indigo-500/60"
      }`}
      style={{
        minWidth: "260px",
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-background" />
      <div className="flex items-center gap-3 px-4 py-3 border-b border-indigo-800/40" style={{ background: "rgba(79,70,229,0.2)" }}>
        <div className="grid place-items-center w-9 h-9 rounded-lg bg-indigo-50/20 text-indigo-300 border border-indigo-400/30">
          <Network className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-white truncate">{d.name}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-indigo-300 font-medium">DIO ÓPTICO {d.connectorType}</div>
        </div>
        <button
          onClick={() => remove(id)}
          className="opacity-0 group-hover:opacity-100 transition text-indigo-300 hover:text-red-400 p-1"
          aria-label="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 pb-3.5 pt-3">
        <div className="flex items-center justify-between text-[11px] text-indigo-200/80 mb-1.5">
          <span>Acopladores</span>
          <span className="font-mono text-white">{Math.min(used, d.ports)}/{d.ports}</span>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(d.ports, 24)}, minmax(0,1fr))` }}>
          {Array.from({ length: d.ports }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-sm ${i < used ? (d.connectorType === "SC/APC" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]") : "bg-indigo-950/50"}`}
              style={{ border: i < used ? undefined : "1px solid rgba(79,70,229,0.25)" }}
            />
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-background" />
    </motion.div>
  );
}
