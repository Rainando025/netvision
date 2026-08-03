import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { X } from "lucide-react";
import { useDiagram } from "@/lib/store";

export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  animated,
  className,
}: EdgeProps & { className?: string }) {
  const removeEdge = useDiagram((s) => s.removeEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
        className={className}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan group"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeEdge(id);
            }}
            className="
              opacity-0 group-hover:opacity-100
              w-5 h-5 rounded-full
              bg-destructive text-white
              flex items-center justify-center
              shadow-lg border border-white/20
              transition-all duration-150
              hover:scale-110 hover:bg-red-600
            "
            title="Remover ligação"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
