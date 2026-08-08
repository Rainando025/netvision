import { Handle, Position } from "@xyflow/react";
import type { PatchPanelNodeData } from "@/lib/types";
import { GripHorizontal, X } from "lucide-react";
import { useDiagram } from "@/lib/store";

export function PatchPanelNode({ id, data, selected }: { id: string; data: PatchPanelNodeData; selected?: boolean }) {
  const removeNode = useDiagram((s) => s.removeNode);

  return (
    <div
      className={`group relative rounded-xl border-2 shadow-lg transition-all overflow-hidden ${
        selected
          ? "border-slate-400 shadow-slate-500/30 scale-[1.02]"
          : "border-slate-800/60 hover:border-slate-500/60"
      }`}
      style={{
        minWidth: "200px",
        background: "linear-gradient(135deg, #1e293b 0%, #334155 60%, #475569 100%)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3 !border-2 !border-background" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-500/20 text-slate-300 border border-slate-400/30">
            <GripHorizontal className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-sm text-white truncate">{data.name}</h3>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Patch Panel</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); removeNode(id); }}
            className="opacity-0 group-hover:opacity-100 ml-auto p-1 rounded text-slate-300 hover:text-red-400 transition-colors"
            title="Remover"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="bg-slate-900/40 rounded p-2 text-center border border-slate-800/40">
          <span className="text-[10px] text-slate-300 block mb-0.5">Portas RJ45</span>
          <span className="text-xs font-medium text-white">{data.ports}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3 !border-2 !border-background" />
    </div>
  );
}
