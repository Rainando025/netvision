import { Handle, Position } from "@xyflow/react";
import type { InverterNodeData } from "@/lib/types";
import { Zap, X } from "lucide-react";
import { useDiagram } from "@/lib/store";

export function InverterNode({ id, data, selected }: { id: string; data: InverterNodeData; selected?: boolean }) {
  const removeNode = useDiagram((s) => s.removeNode);

  return (
    <div
      className={`relative min-w-[200px] bg-card/95 backdrop-blur-xl border-2 rounded-xl shadow-xl transition-all duration-300 ${
        selected ? "border-primary shadow-primary/20 scale-[1.02]" : "border-border/60 hover:border-border hover:shadow-2xl"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary border-2 border-background" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-sm text-foreground">{data.name}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Inversor / Retificador</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); removeNode(id); }}
            className="ml-auto p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Remover"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="bg-background/50 rounded p-2 text-center border border-border/50">
          <span className="text-[10px] text-muted-foreground block mb-0.5">Potência (W)</span>
          <span className="text-xs font-medium text-foreground">{data.powerWatts}W</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary border-2 border-background" />
    </div>
  );
}
