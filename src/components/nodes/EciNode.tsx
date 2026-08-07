import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import type { EciNodeData } from "@/lib/types";
import { useDiagram } from "@/lib/store";

export function EciNode({ id, data, selected }: NodeProps) {
  const d = data as EciNodeData;
  const remove = useDiagram((s) => s.removeNode);

  return (
    <div
      className={`group relative rounded-xl border-2 shadow-lg transition-all overflow-hidden ${
        selected
          ? "border-slate-400 shadow-slate-400/30"
          : "border-slate-700/70 hover:border-slate-500/60"
      }`}
      style={{
        minWidth: "280px",
        background: "linear-gradient(160deg, #1b2a45 0%, #243551 55%, #1e3060 100%)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3 !border-2 !border-background" />

      {/* ── Top header bar ── */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b border-slate-600/40"
        style={{ background: "rgba(30,48,96,0.5)" }}
      >
        <div className="flex items-center gap-2">
          {/* ECI brand plate */}
          <span
            className="text-[8px] font-black tracking-[0.22em] uppercase px-1.5 py-0.5 rounded"
            style={{ background: "#0e3a8c", color: "#7ec8ff", border: "1px solid #3a6fc0" }}
          >
            ECI
          </span>
          <span className="text-[9px] font-semibold tracking-wider text-slate-300 uppercase">
            {d.model || "9603"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status LEDs */}
          <div className="flex gap-1">
            {[0x22c55e, 0x22c55e, 0xf59e0b, 0x888888, 0x888888].map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: i === 0 ? "#22c55e" : i === 1 ? "#22c55e" : i === 2 ? "#f59e0b" : "#334155",
                  boxShadow: i < 2 ? "0 0 4px #22c55e" : "none",
                }}
              />
            ))}
          </div>
          <button
            onClick={() => remove(id)}
            className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-400 p-0.5"
            aria-label="Remover"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Main front panel ── */}
      <div className="flex gap-0 p-2">

        {/* LEFT — Management / uplink module */}
        <div
          className="flex-shrink-0 rounded-md p-1.5 flex flex-col gap-1.5"
          style={{
            width: "96px",
            background: "linear-gradient(135deg, #162040 0%, #1e3060 100%)",
            border: "1px solid rgba(60,100,180,0.35)",
          }}
        >
          {/* SFP+ row 1 */}
          <div className="flex flex-wrap gap-0.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[2px]"
                style={{
                  width: "6px",
                  height: "7px",
                  background: i < 8 ? "#0e2a60" : "#1a3a7a",
                  border: "1px solid rgba(80,130,220,0.4)",
                }}
              />
            ))}
          </div>

          {/* RJ45 Management ports */}
          <div className="flex gap-1">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-[2px] flex items-center justify-center"
                style={{
                  width: "12px",
                  height: "9px",
                  background: "#0a1e3a",
                  border: "1px solid rgba(80,130,220,0.5)",
                }}
              >
                <div style={{ width: "8px", height: "2px", background: "#2a7fff", borderRadius: "1px" }} />
              </div>
            ))}
            {/* SFP uplink */}
            <div
              className="rounded-[2px]"
              style={{
                width: "14px",
                height: "9px",
                background: "#1a1a2e",
                border: "1px solid rgba(100,140,220,0.5)",
              }}
            />
          </div>

          {/* Name label */}
          <div className="mt-0.5">
            <p className="text-[9px] font-semibold text-slate-200 truncate leading-tight">{d.name}</p>
            <p className="text-[8px] text-slate-400 font-mono">
              {d.ip || "ECI Platform"}
            </p>
          </div>
        </div>

        {/* RIGHT — Optical line modules (2 × grid of LC connectors) */}
        <div className="flex flex-col gap-1 ml-2 flex-1">
          {[0, 1].map((moduleIdx) => (
            <div
              key={moduleIdx}
              className="rounded-md p-1.5"
              style={{
                background: "linear-gradient(135deg, #182038 0%, #1e2c50 100%)",
                border: "1px solid rgba(50,90,160,0.40)",
              }}
            >
              {/* Grid of LC connectors — 2 rows × 8 cols = 16 per module */}
              <div className="flex flex-col gap-0.5">
                {[0, 1].map((row) => (
                  <div key={row} className="flex gap-0.5">
                    {Array.from({ length: 8 }).map((_, col) => {
                      const portIdx = moduleIdx * 16 + row * 8 + col;
                      const active = portIdx < (d.activePorts ?? 8);
                      return (
                        <div
                          key={col}
                          className="rounded-[2px] transition-all"
                          style={{
                            width: "10px",
                            height: "9px",
                            background: active ? "#1a5fd0" : "#0e1e40",
                            border: `1px solid ${active ? "rgba(80,160,255,0.7)" : "rgba(40,80,140,0.4)"}`,
                            boxShadow: active ? "0 0 3px rgba(59,130,246,0.6)" : "none",
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Module label */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">
                  {moduleIdx === 0 ? "Line · 1-16" : "Line · 17-32"}
                </span>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full" style={{ background: "#22c55e", boxShadow: "0 0 3px #22c55e" }} />
                  <div className="w-1 h-1 rounded-full" style={{ background: "#334155" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAR RIGHT — model plate + power button */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-between ml-1.5 px-1 py-1 rounded-md"
          style={{
            background: "rgba(14,22,45,0.6)",
            border: "1px solid rgba(50,80,140,0.3)",
            width: "22px",
          }}
        >
          <div
            className="text-[7px] font-black tracking-widest uppercase"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", color: "#7ec8ff", letterSpacing: "0.25em" }}
          >
            9603
          </div>
          {/* Power button */}
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: "radial-gradient(circle, #22c55e 40%, #14532d 100%)",
              border: "1px solid rgba(34,197,94,0.5)",
              boxShadow: "0 0 5px rgba(34,197,94,0.7)",
            }}
          />
        </div>
      </div>

      {/* ── Bottom cable-management groove ── */}
      <div
        className="h-1.5 mx-2 mb-1.5 rounded-sm flex gap-0.5 items-center px-1 overflow-hidden"
        style={{ background: "rgba(10,18,40,0.7)", border: "1px solid rgba(40,70,130,0.3)" }}
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            style={{ width: "3px", height: "3px", background: "#1a3070", borderRadius: "1px", flexShrink: 0 }}
          />
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3 !border-2 !border-background" />
    </div>
  );
}
