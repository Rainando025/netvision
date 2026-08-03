import { type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Lightbulb, Trash2 } from "lucide-react";
import type { LampNodeData } from "@/lib/types";
import { useDiagram } from "@/lib/store";

export function LampNode({ id, data, selected }: NodeProps) {
  const d = data as LampNodeData;
  const remove = useDiagram((s) => s.removeNode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`group relative rounded-lg glass min-w-[160px] border-yellow-500/20 ${selected ? "glow-cyan" : ""}`}
    >
      <div className="flex items-center gap-3 px-3 py-2 border-border/40">
        <div className="grid place-items-center w-7 h-7 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-sm truncate">{d.name}</div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Luz · Lâmpada</div>
        </div>
        <button
          onClick={() => remove(id)}
          className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive p-1"
          aria-label="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
