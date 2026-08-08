import { Handle, Position } from "@xyflow/react";
import type { InverterNodeData } from "@/lib/types";
import { Zap, X } from "lucide-react";
import { useDiagram } from "@/lib/store";

export function InverterNode({ id, data, selected }: { id: string; data: InverterNodeData; selected?: boolean }) {
  const removeNode = useDiagram((s) => s.removeNode);

  return (
    <div
      className={`group relative rounded-xl border-2 shadow-lg transition-all overflow-hidden ${
        selected
          ? "border-teal-400 shadow-teal-500/30 scale-[1.02]"
          : "border-teal-900/60 hover:border-teal-500/60"
      }`}
      style={{
        minWidth: "200px",
        background: "linear-gradient(135deg, #072522 0%, #0b4a44 60%, #0d9488 100%)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-teal-400 !w-3 !h-3 !border-2 !border-background" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-400/30">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-sm text-white truncate">{data.name}</h3>
            <p className="text-[10px] text-teal-300 font-bold uppercase tracking-wider">Inversor / Retificador</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); removeNode(id); }}
            className="opacity-0 group-hover:opacity-100 ml-auto p-1 rounded text-teal-300 hover:text-red-400 transition-colors"
            title="Remover"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="bg-teal-950/40 rounded p-2 text-center border border-teal-800/40">
          <span className="text-[10px] text-teal-300 block mb-0.5">Potência (W)</span>
          <span className="text-xs font-medium text-white">{data.powerWatts}W</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-teal-400 !w-3 !h-3 !border-2 !border-background" />
    </div>
  );
}
