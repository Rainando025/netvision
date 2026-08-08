import { Handle, Position } from "@xyflow/react";
import type { BatteryRackNodeData } from "@/lib/types";
import { BatteryCharging, X } from "lucide-react";
import { useDiagram } from "@/lib/store";

export function BatteryRackNode({ id, data, selected }: { id: string; data: BatteryRackNodeData; selected?: boolean }) {
  const removeNode = useDiagram((s) => s.removeNode);

  return (
    <div
      className={`group relative rounded-xl border-2 shadow-lg transition-all overflow-hidden ${
        selected
          ? "border-amber-400 shadow-amber-500/30 scale-[1.02]"
          : "border-amber-900/60 hover:border-amber-500/60"
      }`}
      style={{
        minWidth: "230px",
        background: "linear-gradient(135deg, #3d2504 0%, #5f3706 60%, #b45309 100%)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-400 !w-3 !h-3 !border-2 !border-background" />

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); removeNode(id); }}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-10 border border-white/20 shadow"
        title="Remover Rack de Bateria"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-sm text-white truncate">{data.name}</h3>
            <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Banco de Baterias (48V)</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); removeNode(id); }}
            className="ml-auto p-1 rounded text-amber-300 hover:text-red-400 transition-colors"
            title="Remover"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-amber-950/40 rounded p-2 text-center border border-amber-800/40">
            <span className="text-[10px] text-amber-300 block mb-0.5">Qtd Baterias</span>
            <span className="text-xs font-semibold text-white">4x 12V Estac.</span>
          </div>
          <div className="bg-amber-950/40 rounded p-2 text-center border border-amber-800/40">
            <span className="text-[10px] text-amber-300 block mb-0.5">Tensão / Saída</span>
            <span className="text-xs font-semibold text-amber-300">48V DC</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-amber-400 !w-3 !h-3 !border-2 !border-background" />
    </div>
  );
}
