import { type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { HardDrive, Trash2 } from "lucide-react";
import type { RackNodeData } from "@/lib/types";
import { useDiagram } from "@/lib/store";

export function RackNode({ id, data, selected }: NodeProps) {
  const d = data as RackNodeData;
  const remove = useDiagram((s) => s.removeNode);
  const nodes = useDiagram((s) => s.nodes);

  const mountedDevices = nodes
    .filter((n) => n.data.rackId === id)
    .sort((a, b) => (a.data.rackUnit ?? 0) - (b.data.rackUnit ?? 0));

  const isClosed = d.rackType !== "open";
  const rackLabel = isClosed ? "Rack Gabinete" : "Rack Aberto";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`group relative rounded-2xl glass min-w-[280px] border-primary/20 ${selected ? "glow-cyan" : ""}`}
    >
      {/* No connection handles — racks are containers, not network nodes */}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2 border-b border-border/40">
        <div className={`grid place-items-center w-9 h-9 rounded-lg border ${
          isClosed 
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        }`}>
          <HardDrive className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold truncate">{d.name}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{rackLabel} · {d.units}U</div>
        </div>
        <button
          onClick={() => remove(id)}
          className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive p-1"
          aria-label="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Rack slot occupancy */}
      <div className="p-4 space-y-2 max-h-[220px] overflow-y-auto">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          Equipamentos Montados
        </div>
        {mountedDevices.length === 0 ? (
          <div className="text-xs text-muted-foreground italic text-center py-4 bg-secondary/20 rounded-lg border border-dashed border-border/40">
            Nenhum equipamento montado em 3D
          </div>
        ) : (
          <div className="space-y-1 font-mono text-xs">
            {mountedDevices.map((node) => {
              const uStart = node.data.rackUnit ?? 1;
              const uHeight = node.data.rackUHeight ?? 1;
              const uRange = uHeight > 1 ? `${uStart}-${uStart + uHeight - 1}U` : `${uStart}U`;
              return (
                <div
                  key={node.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded bg-secondary/40 border border-border/20 text-foreground"
                >
                  <span className="font-medium truncate max-w-[170px]">{node.data.name}</span>
                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                    {uRange}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
