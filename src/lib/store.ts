import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase, isSupabaseConfigured } from "./supabase";
import type { Edge, Node } from "@xyflow/react";
import type { NodeData } from "./types";

const DEFAULT_LOCATION_ID = "principal";

interface DiagramLocation {
  id: string;
  name: string;
  parentId?: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
}

interface DiagramState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  locations: Record<string, DiagramLocation>;
  activeLocationId: string;
  setNodes: (n: Node<NodeData>[]) => void;
  setEdges: (e: Edge[]) => void;
  addNode: (n: Node<NodeData>) => void;
  updateNodeData: (id: string, patch: Partial<NodeData>) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  updateEdge: (id: string, patch: Partial<Edge>) => void;
  addEdge: (e: Edge) => void;
  createLocation: (name: string, parentId?: string) => void;
  deleteLocation: (id: string) => void;
  selectLocation: (id: string) => void;
}

const createLocationEntry = (id: string, name: string, nodes: Node<NodeData>[] = [], edges: Edge[] = [], parentId?: string): DiagramLocation => ({
  id,
  name,
  parentId,
  nodes,
  edges,
});

const syncToSupabase = async (nodes: Node<NodeData>[], edges: Edge[], activeLocationId: string) => {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase!.from("diagrams").upsert({
      id: activeLocationId,
      payload: JSON.stringify({ nodes, edges }),
    });
  } catch (e) {
    console.warn("supabase upsert failed", e);
  }
};

export const useDiagram = create<DiagramState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      locations: {
        [DEFAULT_LOCATION_ID]: createLocationEntry(DEFAULT_LOCATION_ID, "Principal"),
      },
      activeLocationId: DEFAULT_LOCATION_ID,
      setNodes: (nodes) => {
        const state = get();
        const activeId = state.activeLocationId || DEFAULT_LOCATION_ID;
        const currentLocation = state.locations[activeId] ?? createLocationEntry(activeId, "Principal", state.nodes, state.edges);
        const nextLocations = {
          ...state.locations,
          [activeId]: { ...currentLocation, id: activeId, name: currentLocation.name, nodes, edges: state.edges },
        };

        set({ nodes, edges: state.edges, locations: nextLocations, activeLocationId: activeId });
        void syncToSupabase(nodes, state.edges, activeId);
      },
      setEdges: (edges) => {
        const state = get();
        const activeId = state.activeLocationId || DEFAULT_LOCATION_ID;
        const currentLocation = state.locations[activeId] ?? createLocationEntry(activeId, "Principal", state.nodes, state.edges);
        const nextLocations = {
          ...state.locations,
          [activeId]: { ...currentLocation, id: activeId, name: currentLocation.name, nodes: state.nodes, edges },
        };

        set({ nodes: state.nodes, edges, locations: nextLocations, activeLocationId: activeId });
        void syncToSupabase(state.nodes, edges, activeId);
      },
      addNode: (n) => {
        const state = get();
        const nextNodes = [...state.nodes, n];
        const activeId = state.activeLocationId || DEFAULT_LOCATION_ID;
        const currentLocation = state.locations[activeId] ?? createLocationEntry(activeId, "Principal", state.nodes, state.edges);
        const nextLocations = {
          ...state.locations,
          [activeId]: { ...currentLocation, id: activeId, name: currentLocation.name, nodes: nextNodes, edges: state.edges },
        };

        set({ nodes: nextNodes, edges: state.edges, locations: nextLocations, activeLocationId: activeId });
        void syncToSupabase(nextNodes, state.edges, activeId);
      },
      updateNodeData: (id, patch) => {
        const state = get();
        const nextNodes = state.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...patch } as NodeData } : n
        );
        const activeId = state.activeLocationId || DEFAULT_LOCATION_ID;
        const currentLocation = state.locations[activeId] ?? createLocationEntry(activeId, "Principal", state.nodes, state.edges);
        const nextLocations = {
          ...state.locations,
          [activeId]: { ...currentLocation, id: activeId, name: currentLocation.name, nodes: nextNodes, edges: state.edges },
        };

        set({ nodes: nextNodes, edges: state.edges, locations: nextLocations, activeLocationId: activeId });
        void syncToSupabase(nextNodes, state.edges, activeId);
      },
      removeNode: (id) => {
        const state = get();
        const nextNodes = state.nodes.filter((n) => n.id !== id);
        const nextEdges = state.edges.filter((e) => e.source !== id && e.target !== id);
        const activeId = state.activeLocationId || DEFAULT_LOCATION_ID;
        const currentLocation = state.locations[activeId] ?? createLocationEntry(activeId, "Principal", state.nodes, state.edges);
        const nextLocations = {
          ...state.locations,
          [activeId]: { ...currentLocation, id: activeId, name: currentLocation.name, nodes: nextNodes, edges: nextEdges },
        };

        set({ nodes: nextNodes, edges: nextEdges, locations: nextLocations, activeLocationId: activeId });
        void syncToSupabase(nextNodes, nextEdges, activeId);
      },
      removeEdge: (id) => {
        const state = get();
        const nextEdges = state.edges.filter((e) => e.id !== id);
        const activeId = state.activeLocationId || DEFAULT_LOCATION_ID;
        const currentLocation = state.locations[activeId] ?? createLocationEntry(activeId, "Principal", state.nodes, state.edges);
        const nextLocations = {
          ...state.locations,
          [activeId]: { ...currentLocation, id: activeId, name: currentLocation.name, nodes: state.nodes, edges: nextEdges },
        };
        set({ nodes: state.nodes, edges: nextEdges, locations: nextLocations, activeLocationId: activeId });
        void syncToSupabase(state.nodes, nextEdges, activeId);
      },
      updateEdge: (id, patch) => {
        const state = get();
        const nextEdges = state.edges.map((e) => e.id === id ? { ...e, ...patch } : e);
        const activeId = state.activeLocationId || DEFAULT_LOCATION_ID;
        const currentLocation = state.locations[activeId] ?? createLocationEntry(activeId, "Principal", state.nodes, state.edges);
        const nextLocations = {
          ...state.locations,
          [activeId]: { ...currentLocation, id: activeId, name: currentLocation.name, nodes: state.nodes, edges: nextEdges },
        };
        set({ nodes: state.nodes, edges: nextEdges, locations: nextLocations, activeLocationId: activeId });
        void syncToSupabase(state.nodes, nextEdges, activeId);
      },
      addEdge: (e) => {
        const state = get();
        const nextEdges = [...state.edges, e];
        const activeId = state.activeLocationId || DEFAULT_LOCATION_ID;
        const currentLocation = state.locations[activeId] ?? createLocationEntry(activeId, "Principal", state.nodes, state.edges);
        const nextLocations = {
          ...state.locations,
          [activeId]: { ...currentLocation, id: activeId, name: currentLocation.name, nodes: state.nodes, edges: nextEdges },
        };

        set({ nodes: state.nodes, edges: nextEdges, locations: nextLocations, activeLocationId: activeId });
        void syncToSupabase(state.nodes, nextEdges, activeId);
      },
      createLocation: (name, parentId) => {
        const state = get();
        const nextName = name.trim() || `Local ${Object.keys(state.locations).length + 1}`;
        const id = `${nextName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
        const entry = createLocationEntry(id, nextName, [], [], parentId);
        const nextLocations = {
          ...state.locations,
          [id]: entry,
        };

        set({
          nodes: [],
          edges: [],
          locations: nextLocations,
          activeLocationId: id,
        });
      },
      deleteLocation: (id) => {
        const state = get();
        if (id === DEFAULT_LOCATION_ID) return; // Prevent deleting default
        const nextLocations = { ...state.locations };
        
        // Helper to delete recursively
        const deleteRecursive = (targetId: string) => {
          delete nextLocations[targetId];
          Object.values(nextLocations).forEach((loc) => {
            if (loc.parentId === targetId) deleteRecursive(loc.id);
          });
        };
        
        deleteRecursive(id);
        
        const nextActiveId = nextLocations[state.activeLocationId] ? state.activeLocationId : DEFAULT_LOCATION_ID;
        const activeLoc = nextLocations[nextActiveId];
        
        set({
          locations: nextLocations,
          activeLocationId: nextActiveId,
          nodes: activeLoc ? activeLoc.nodes : [],
          edges: activeLoc ? activeLoc.edges : [],
        });
      },
      selectLocation: (id) => {
        const state = get();
        const location = state.locations[id];
        if (!location) return;

        set({
          nodes: location.nodes,
          edges: location.edges,
          activeLocationId: id,
        });
      },
    }),
    {
      name: "netvision-diagram",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as never))),
      merge: (persistedState: unknown, currentState: DiagramState) => {
        const incoming = (persistedState || {}) as Partial<DiagramState> & {
          nodes?: Node<NodeData>[];
          edges?: Edge[];
          locations?: Record<string, DiagramLocation>;
          activeLocationId?: string;
        };
        const activeId = incoming.activeLocationId || DEFAULT_LOCATION_ID;
        const mergedLocations = incoming.locations && Object.keys(incoming.locations).length > 0
          ? incoming.locations
          : {
              [activeId]: createLocationEntry(activeId, "Principal", incoming.nodes ?? [], incoming.edges ?? []),
            };
        const activeLocation = mergedLocations[activeId] ?? createLocationEntry(activeId, "Principal", incoming.nodes ?? [], incoming.edges ?? []);

        return {
          ...currentState,
          ...incoming,
          nodes: activeLocation.nodes ?? incoming.nodes ?? currentState.nodes,
          edges: activeLocation.edges ?? incoming.edges ?? currentState.edges,
          locations: mergedLocations,
          activeLocationId: activeId,
        } as DiagramState;
      },
    }
  )
);

// Real-time sync: subscribe to Supabase 'diagrams' table and apply remote updates
if (typeof window !== "undefined" && isSupabaseConfigured()) {
  (async () => {
    try {
      const activeId = (useDiagram as any).getState().activeLocationId || DEFAULT_LOCATION_ID;
      const { data } = await supabase!.from("diagrams").select("payload").eq("id", activeId).maybeSingle();
      if (data && data.payload) {
        try {
          const parsed = JSON.parse(data.payload || "{}");
          if (parsed.nodes || parsed.edges) {
            (useDiagram as any).setState({ nodes: parsed.nodes || [], edges: parsed.edges || [] });
          }
        } catch (err) {
          console.warn("failed parsing diagrams payload", err);
        }
      }

      const channel = supabase!
        .channel("realtime-diagrams")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "diagrams", filter: `id=eq.${activeId}` },
          (payload) => {
            try {
              const p = payload?.new?.payload;
              if (!p) return;
              const parsed = JSON.parse(p);
              const localNodes = (useDiagram as any).getState().nodes;
              const localEdges = (useDiagram as any).getState().edges;
              const same = JSON.stringify(localNodes) === JSON.stringify(parsed.nodes) && JSON.stringify(localEdges) === JSON.stringify(parsed.edges);
              if (!same) {
                (useDiagram as any).setState({ nodes: parsed.nodes || [], edges: parsed.edges || [] });
              }
            } catch (err) {
              console.warn("failed handling realtime diagram payload", err);
            }
          }
        )
        .subscribe();

      window.addEventListener("beforeunload", () => {
        try { channel.unsubscribe(); } catch (e) { /* ignore */ }
      });
    } catch (err) {
      console.warn("supabase realtime init failed", err);
    }
  })();
}
