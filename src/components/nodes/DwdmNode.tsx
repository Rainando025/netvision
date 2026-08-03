import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Activity, Trash2 } from "lucide-react";
import type { DwdmNodeData } from "@/lib/types";
import { useDiagram } from "@/lib/store";

export function DwdmNode({ id, data, selected }: NodeProps) {
  const d = data as DwdmNodeData;
  const remove = useDiagram((s) => s.removeNode);

  return (
    <div
      className={`group relative rounded-xl border-2 backdrop-blur-sm shadow-lg transition-all overflow-hidden ${
        selected
          ? "border-blue-400 shadow-blue-500/30"
          : "border-blue-900/60 hover:border-blue-500/60"
      }`}
      style={{
        minWidth: "220px",
        background: "linear-gradient(135deg, #0f2255 0%, #1a3a7a 60%, #1d4ed8 100%)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-3 !h-3 !border-2 !border-background" />

      {/* Top branding strip */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-blue-600/40" style={{ background: "rgba(29,78,216,0.35)" }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold tracking-widest text-blue-200 uppercase">OptiX</span>
          <span className="text-[9px] text-blue-300 tracking-widest">OSN</span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: i < 2 ? "#22c55e" : i === 2 ? "#f59e0b" : "#374151" }}
            />
          ))}
        </div>
        <button
          onClick={() => remove(id)}
          className="opacity-0 group-hover:opacity-100 transition text-blue-300 hover:text-red-400 p-0.5"
          aria-label="Remover"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex items-start gap-3 p-3">
        <div className="grid place-items-center w-10 h-10 rounded-lg flex-shrink-0" style={{ background: "rgba(29,78,216,0.4)", border: "1px solid rgba(96,165,250,0.3)" }}>
          <Activity className="w-5 h-5 text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight text-white truncate">{d.name}</h3>
          <p className="text-[11px] text-blue-300 mt-0.5">{d.model || "DWDM"}</p>
          {d.ip && (
            <p className="text-[10px] font-mono text-blue-400/70 mt-0.5">{d.ip}</p>
          )}
        </div>
      </div>

      {/* Optical connector strip — decorative */}
      <div className="px-3 pb-2.5 flex gap-0.5 flex-wrap">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-sm"
            style={{ background: i % 4 < 2 ? "#2a7fff" : "#0f2255", border: "1px solid rgba(96,165,250,0.25)" }}
          />
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-3 !h-3 !border-2 !border-background" />
    </div>
  );
}
