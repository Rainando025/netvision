import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Router, Trash2 } from "lucide-react";
import type { RouterNodeData } from "@/lib/types";
import { useDiagram } from "@/lib/store";

export function RouterNode({ id, data, selected }: NodeProps) {
  const d = data as RouterNodeData;
  const remove = useDiagram((s) => s.removeNode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`group relative rounded-xl border-2 shadow-lg transition-all overflow-hidden ${
        selected
          ? "border-orange-400 shadow-orange-500/30"
          : "border-orange-900/60 hover:border-orange-500/60"
      }`}
      style={{
        minWidth: "200px",
        background: "linear-gradient(135deg, #4c2206 0%, #7c2d12 60%, #ea580c 100%)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-orange-400 !w-3 !h-3 !border-2 !border-background" />
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-orange-850/40" style={{ background: "rgba(234,88,12,0.2)" }}>
        <div className="grid place-items-center w-9 h-9 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-400/30">
          <Router className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-white truncate">{d.name}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-orange-300 font-medium">Roteador</div>
        </div>
        <button
          onClick={() => remove(id)}
          className="opacity-0 group-hover:opacity-100 transition text-orange-300 hover:text-red-400 p-1"
          aria-label="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-400 !w-3 !h-3 !border-2 !border-background" />
    </motion.div>
  );
}
