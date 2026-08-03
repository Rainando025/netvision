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
      className={`group relative rounded-2xl glass min-w-[200px] ${selected ? "glow-cyan" : ""}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="grid place-items-center w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Server className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold truncate">{d.name}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Servidor</div>
        </div>
        <button
          onClick={() => remove(id)}
          className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive p-1"
          aria-label="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(d.diskCount, 4) }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-sm bg-blue-500/50 shadow-[0_0_4px_rgba(59,130,246,0.3)] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </motion.div>
  );
}
