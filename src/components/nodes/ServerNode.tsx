import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Server, Trash2 } from "lucide-react";
import type { ServerNodeData } from "@/lib/types";
import { useDiagram } from "@/lib/store";

export function ServerNode({ id, data, selected }: NodeProps) {
  const d = data as ServerNodeData;
  const remove = useDiagram((s) => s.removeNode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`group relative rounded-xl border-2 shadow-lg transition-all overflow-hidden ${
        selected
          ? "border-blue-400 shadow-blue-500/30"
          : "border-blue-900/60 hover:border-blue-500/60"
      }`}
      style={{
        minWidth: "200px",
        background: "linear-gradient(135deg, #0e1e38 0%, #1e3a6c 60%, #2563eb 100%)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-3 !h-3 !border-2 !border-background" />
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-blue-800/40" style={{ background: "rgba(37,99,235,0.2)" }}>
        <div className="grid place-items-center w-9 h-9 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
          <Server className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-white truncate">{d.name}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300 font-medium">Servidor</div>
        </div>
        <button
          onClick={() => remove(id)}
          className="opacity-0 group-hover:opacity-100 transition text-blue-300 hover:text-red-400 p-1"
          aria-label="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-4 pb-3.5 pt-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(d.diskCount, 4) }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-sm bg-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.5)] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-3 !h-3 !border-2 !border-background" />
    </motion.div>
  );
}
