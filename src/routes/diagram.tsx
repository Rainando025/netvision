import { createFileRoute } from "@tanstack/react-router";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type Node,
} from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { AppShell, useTheme } from "@/components/AppShell";
import { SwitchNode } from "@/components/nodes/SwitchNode";
import { CameraNode } from "@/components/nodes/CameraNode";
import { RackNode } from "@/components/nodes/RackNode";
import { WallNode } from "@/components/nodes/WallNode";
import { DoorNode } from "@/components/nodes/DoorNode";
import { LampNode } from "@/components/nodes/LampNode";
import { CeilingNode } from "@/components/nodes/CeilingNode";
import { OltNode } from "@/components/nodes/OltNode";
import { DioNode } from "@/components/nodes/DioNode";
import { RouterNode } from "@/components/nodes/RouterNode";
import { ServerNode } from "@/components/nodes/ServerNode";
import { BatteryRackNode } from "@/components/nodes/BatteryRackNode";
import { StationaryBatteryNode } from "@/components/nodes/StationaryBatteryNode";
import { InverterNode } from "@/components/nodes/InverterNode";
import { SolarNode } from "@/components/nodes/SolarNode";
import { PatchPanelNode } from "@/components/nodes/PatchPanelNode";
import { DwdmNode } from "@/components/nodes/DwdmNode";
import { AddDeviceMenu } from "@/components/AddDeviceMenu";
import { Diagram3D } from "@/components/Diagram3D";
import { useDiagram } from "@/lib/store";
import type { NodeData } from "@/lib/types";
import {
  Box, FolderOpen, Folder, Layers, MapPin, Plus, Maximize2, ChevronLeft,
  Trash2, FolderPlus, ChevronRight, ChevronDown, List, LayoutGrid, Network, Search
} from "lucide-react";
import { DeletableEdge } from "@/components/DeletableEdge";

export const Route = createFileRoute("/diagram")({
  head: () => ({
    meta: [
      { title: "Diagrama de Rede · NetVision" },
      { name: "description", content: "Monte seu diagrama de switches e câmeras IP, conecte dispositivos e acompanhe o ping em tempo real." },
    ],
  }),
  component: DiagramPage,
});

function DiagramPage() {
  const nodes = useDiagram((s) => s.nodes);
  const edges = useDiagram((s) => s.edges);
  const locations = useDiagram((s) => s.locations);
  const activeLocationId = useDiagram((s) => s.activeLocationId);
  const setNodes = useDiagram((s) => s.setNodes);
  const setEdges = useDiagram((s) => s.setEdges);
  const removeNode = useDiagram((s) => s.removeNode);
  const removeEdge = useDiagram((s) => s.removeEdge);
  const createLocation = useDiagram((s) => s.createLocation);
  const deleteLocation = useDiagram((s) => s.deleteLocation);
  const selectLocation = useDiagram((s) => s.selectLocation);

  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [creatingSubfolderFor, setCreatingSubfolderFor] = useState<string | null>(null);
  const [locationError, setLocationError] = useState("");
  const [showDiagram, setShowDiagram] = useState(false);
  const [folderViewMode, setFolderViewMode] = useState<"grid" | "list">("grid");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [globalFilter, setGlobalFilter] = useState("");
  const { theme } = useTheme();

  const edgeTypes = useMemo(() => ({ deletable: DeletableEdge }), []);
  const activeLocation = locations[activeLocationId] ?? null;

  const nodeTypes = useMemo(() => ({
    switch: SwitchNode,
    camera: CameraNode,
    rack: RackNode,
    wall: WallNode,
    door: DoorNode,
    lamp: LampNode,
    ceiling: CeilingNode,
    olt: OltNode,
    dio: DioNode,
    router: RouterNode,
    server: ServerNode,
    battery_rack: BatteryRackNode,
    stationary_battery: StationaryBatteryNode,
    inverter: InverterNode,
    solar: SolarNode,
    patchpanel: PatchPanelNode,
    dwdm: DwdmNode,
  }), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(applyNodeChanges(changes, nodes) as Node<NodeData>[]),
    [nodes, setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges]
  );
  const onNodesDelete = useCallback(
    (deleted: Node<NodeData>[]) => { deleted.forEach((n) => removeNode(n.id)); },
    [removeNode]
  );
  const onEdgesDelete = useCallback(
    (deleted: { id: string }[]) => { deleted.forEach((e) => removeEdge(e.id)); },
    [removeEdge]
  );
  const onConnect = useCallback(
    (c: Connection) => {
      const target = nodes.find((n) => n.id === c.target);
      const source = nodes.find((n) => n.id === c.source);
      const cam = (target?.data as NodeData).kind === "camera" ? target : (source?.data as NodeData).kind === "camera" ? source : null;
      const offline = cam && (cam.data as { status?: string }).status === "offline";
      const isPower = ["stationary_battery", "battery_rack", "inverter", "solar"].includes((source?.data as NodeData)?.kind as string)
        || ["stationary_battery", "battery_rack", "inverter", "solar"].includes((target?.data as NodeData)?.kind as string);
      let className = offline ? "offline" : "animated";
      if (isPower && !offline) className = "power-cable animated";
      setEdges(addEdge({ ...c, data: { isPower }, animated: !offline, className }, edges));
    },
    [nodes, edges, setEdges]
  );

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const name = locationName.trim();
    if (!name) { setLocationError("Dê um nome antes de criar."); return; }
    createLocation(name, creatingSubfolderFor || undefined);
    setLocationName("");
    setLocationError("");
    // Auto-expand parent when subfolder is created
    if (creatingSubfolderFor) {
      setExpandedFolders(prev => new Set([...prev, creatingSubfolderFor!]));
    }
    setCreatingSubfolderFor(null);
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openSubfolderDiagram = (locId: string) => {
    selectLocation(locId);
    setShowDiagram(true);
  };

  const rootLocations = Object.values(locations).filter(loc => {
    if (loc.parentId) return false;
    if (!globalFilter) return true;
    const term = globalFilter.toLowerCase();
    
    // Check if parent matches
    if (loc.name.toLowerCase().includes(term)) return true;
    if (loc.nodes.some(n => (n.data.name as string)?.toLowerCase().includes(term) || (n.data.kind as string)?.toLowerCase().includes(term))) return true;
    
    // Check if any child matches
    const children = Object.values(locations).filter(l => l.parentId === loc.id);
    for (const child of children) {
      if (child.name.toLowerCase().includes(term)) return true;
      if (child.nodes.some(n => (n.data.name as string)?.toLowerCase().includes(term) || (n.data.kind as string)?.toLowerCase().includes(term))) return true;
    }
    return false;
  });

  // Render a root folder (expandable, shows subfolders inside)
  const renderRootFolder = (locId: string) => {
    const loc = locations[locId];
    if (!loc) return null;
    let children = Object.values(locations).filter(l => l.parentId === locId);
    if (globalFilter) {
      const term = globalFilter.toLowerCase();
      children = children.filter(child => {
        if (child.name.toLowerCase().includes(term)) return true;
        if (child.nodes.some(n => (n.data.name as string)?.toLowerCase().includes(term) || (n.data.kind as string)?.toLowerCase().includes(term))) return true;
        // If parent matched, we might want to keep all children? Let's keep only matching children if there's a filter, 
        // UNLESS the parent itself matched the filter and children didn't. 
        if (loc.name.toLowerCase().includes(term) || loc.nodes.some(n => (n.data.name as string)?.toLowerCase().includes(term))) return true;
        return false;
      });
    }
    const isExpanded = expandedFolders.has(locId) || globalFilter.length > 0;
    const isActive = activeLocationId === locId;

    if (folderViewMode === "list") {
      return (
        <div key={loc.id} className="flex flex-col">
          {/* Root folder row */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition group ${
            isActive ? "border-primary/40 bg-primary/8" : "border-border/50 hover:border-primary/30 hover:bg-secondary/40"
          }`}>
            <button
              type="button"
              onClick={() => toggleFolder(loc.id)}
              className="flex items-center gap-2 flex-1 text-left min-w-0"
            >
              {isExpanded
                ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
              <FolderOpen className="w-4 h-4 text-primary/70 flex-shrink-0" />
              <span className="font-medium text-sm text-foreground truncate">{loc.name}</span>
              <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0 pr-2">{children.length} subpasta{children.length !== 1 ? "s" : ""}</span>
            </button>
            <button onClick={() => setCreatingSubfolderFor(loc.id)} className="p-1 text-muted-foreground hover:text-primary transition opacity-0 group-hover:opacity-100" title="Criar Subpasta">
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            {loc.id !== "principal" && (
              <button onClick={() => deleteLocation(loc.id)} className="p-1 text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100" title="Excluir Pasta">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Children subfolders in list mode */}
          {isExpanded && children.length > 0 && (
            <div className="ml-5 flex flex-col gap-1 mt-1">
              {children.map(child => (
                <div key={child.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition group cursor-pointer ${
                  activeLocationId === child.id ? "border-primary/40 bg-primary/10" : "border-border/40 hover:border-primary/25 hover:bg-secondary/30"
                }`}
                  onClick={() => openSubfolderDiagram(child.id)}
                >
                  <Network className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">{child.name}</span>
                  <span className="text-[10px] text-muted-foreground">{child.nodes.length} equip.</span>
                  {child.id !== "principal" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteLocation(child.id); }}
                      className="p-1 text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100"
                      title="Excluir Subpasta"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {isExpanded && children.length === 0 && (
            <div className="ml-5 mt-1 px-3 py-2 text-xs text-muted-foreground italic">
              Nenhuma subpasta. Use + para criar o primeiro diagrama.
            </div>
          )}
        </div>
      );
    }

    // Grid mode
    return (
      <div key={loc.id} className="flex flex-col gap-2">
        {/* Root folder card */}
        <div className={`flex items-center rounded-xl border transition group ${
          isActive ? "border-primary/40 bg-primary/8 shadow-sm" : "border-border/50 bg-background/60 hover:border-primary/30 hover:bg-secondary/40"
        }`}>
          <button
            type="button"
            onClick={() => toggleFolder(loc.id)}
            className="flex-1 px-4 py-3 text-left flex items-center gap-3"
          >
            {isExpanded
              ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
            <FolderOpen className="w-4 h-4 text-primary/70 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground truncate">{loc.name}</div>
              <div className="text-[10px] text-muted-foreground">{children.length} subpasta{children.length !== 1 ? "s" : ""}</div>
            </div>
          </button>

          <div className="flex border-l border-border/40">
            <button onClick={() => setCreatingSubfolderFor(loc.id)} className="px-2.5 py-2 text-muted-foreground hover:text-primary transition border-r border-border/40" title="Nova Subpasta">
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            {loc.id !== "principal" && (
              <button onClick={() => deleteLocation(loc.id)} className="px-2.5 py-2 text-muted-foreground hover:text-destructive transition" title="Excluir Pasta">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Subfolders (each is a diagram) */}
        {isExpanded && (
          <div className="ml-4 flex flex-col gap-1.5">
            {children.map(child => (
              <div key={child.id}
                className={`flex items-center rounded-lg border transition cursor-pointer group ${
                  activeLocationId === child.id ? "border-primary/40 bg-primary/10 shadow-sm" : "border-border/40 bg-background/40 hover:border-cyan-500/40 hover:bg-secondary/40"
                }`}
                onClick={() => openSubfolderDiagram(child.id)}
              >
                <div className="flex-1 px-3 py-2.5 flex items-center gap-2.5 min-w-0">
                  <Network className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{child.name}</div>
                    <div className="text-[10px] text-muted-foreground">{child.nodes.length} equip. · {child.edges.length} links</div>
                  </div>
                </div>
                {child.id !== "principal" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteLocation(child.id); }}
                    className="px-2.5 py-2 text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100 border-l border-border/40"
                    title="Excluir Diagrama"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {children.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground italic">
                Nenhum diagrama. Crie uma subpasta para começar.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isFullscreen && viewMode === "3d" && (
        <div className="fixed inset-0 z-[9999] bg-background">
          <Diagram3D
            onBack={() => { setViewMode("2d"); setIsFullscreen(false); }}
            isFullscreen={true}
            toggleFullscreen={() => setIsFullscreen(false)}
          />
        </div>
      )}
      <AppShell>
        <div className="h-[calc(100vh-0px)] md:h-screen flex flex-col">
          {!showDiagram ? (
            <>
              <div className="px-6 md:px-8 pt-6 md:pt-8 pb-3 flex items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-primary">Locais e diagramas</div>
                  <h1 className="font-display text-2xl md:text-3xl font-semibold mt-1">Pastas de locais</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crie pastas para organizar locais. Dentro de cada pasta, adicione subpastas — cada subpasta é um diagrama independente.
                  </p>
                </div>
              </div>

              <div className="px-6 md:px-8 pb-4 flex-1 flex flex-col overflow-y-auto">
                <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm flex-1">
                  {/* Top bar: form + view toggle */}
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="grid place-items-center w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/30">
                        <FolderOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-base">Selecione ou crie um local</div>
                        <p className="text-xs text-muted-foreground">
                          {activeLocation ? `Ativo: ${activeLocation.name}` : "Nenhum local selecionado."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* View toggle */}
                      <div className="flex bg-secondary/60 p-0.5 rounded-md border border-border/40">
                        <button
                          onClick={() => setFolderViewMode("grid")}
                          className={`p-1.5 rounded transition ${folderViewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                          title="Visualização em Cards"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setFolderViewMode("list")}
                          className={`p-1.5 rounded transition ${folderViewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                          title="Visualização em Lista"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Create form */}
                      <form onSubmit={handleCreateLocation} className="flex gap-2 flex-wrap">
                        <label className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-1.5 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <input
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            placeholder={creatingSubfolderFor ? `Subpasta de "${locations[creatingSubfolderFor]?.name}"` : "Nome do novo local"}
                            className="bg-transparent outline-none min-w-[180px] text-sm"
                          />
                        </label>
                        <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:glow-cyan transition">
                          <Plus className="w-3.5 h-3.5" />
                          {creatingSubfolderFor ? "Criar Subpasta" : "Criar Pasta"}
                        </button>
                        {creatingSubfolderFor && (
                          <button type="button" onClick={() => setCreatingSubfolderFor(null)} className="inline-flex items-center rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80 transition">
                            Cancelar
                          </button>
                        )}
                      </form>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="relative w-full md:max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Buscar pastas, diagramas ou equipamentos..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  </div>

                  {locationError && <p className="mb-3 text-xs text-destructive">{locationError}</p>}

                  {/* Folder tree */}
                  <div className={folderViewMode === "grid" ? "flex flex-col gap-3" : "flex flex-col gap-1.5"}>
                    {rootLocations.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        <Folder className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>Nenhuma pasta criada ainda.</p>
                        <p className="text-xs mt-1">Use o formulário acima para criar a primeira pasta.</p>
                      </div>
                    )}
                    {rootLocations.map((loc) => renderRootFolder(loc.id))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="px-6 md:px-8 pt-6 md:pt-8 pb-3 flex items-end justify-between gap-4">
                <div>
                  <button onClick={() => setShowDiagram(false)} className="text-sm text-primary hover:underline mb-2 flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Voltar para pastas
                  </button>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-primary">Diagrama do Local</div>
                  <h1 className="font-display text-2xl md:text-3xl font-semibold mt-1">{activeLocation?.name || "Local não encontrado"}</h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex gap-6 text-right mr-2 border-r border-border/40 pr-6">
                    <Stat label="Racks" value={nodes.filter((n) => (n.data as NodeData).kind === "rack").length} />
                    <Stat label="Switches" value={nodes.filter((n) => (n.data as NodeData).kind === "switch").length} />
                    <Stat label="Câmeras" value={nodes.filter((n) => (n.data as NodeData).kind === "camera").length} />
                    <Stat label="Links" value={edges.length} />
                  </div>

                  <div className="flex bg-secondary/60 p-1 rounded-md border border-border/40">
                    <button
                      onClick={() => { setViewMode("2d"); setIsFullscreen(false); }}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-[10px] font-semibold uppercase tracking-wider transition ${
                        viewMode === "2d" ? "bg-primary/25 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      2D
                    </button>
                    <button
                      onClick={() => setViewMode("3d")}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-[10px] font-semibold uppercase tracking-wider transition ${
                        viewMode === "3d" ? "bg-primary/25 text-primary border border-primary/30 glow-cyan" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      3D
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative flex-1 mx-6 md:mx-8 mb-6 md:mb-8 rounded-2xl overflow-hidden">
                <AddDeviceMenu />

                {viewMode === "2d" ? (
                  <div className="relative w-full h-full border border-border/60 rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--color-background)" }}>
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      onNodesDelete={onNodesDelete}
                      onEdgesDelete={onEdgesDelete}
                      nodeTypes={nodeTypes}
                      edgeTypes={edgeTypes}
                      deleteKeyCode="Delete"
                      fitView
                      colorMode={theme}
                      defaultEdgeOptions={{ animated: true, className: "animated", type: "deletable" }}
                      proOptions={{ hideAttribution: true }}
                    >
                      <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} />
                      <Controls position="bottom-right" showInteractive={false} />
                      <MiniMap
                        pannable
                        zoomable
                        nodeColor={(n) => {
                          const k = (n.data as NodeData).kind;
                          if (k === "camera") return "#e879f9";
                          if (k === "rack") return "#10b981";
                          if (k === "olt") return "#22c55e";
                          if (k === "dio") return "#6366f1";
                          if (k === "router") return "#f97316";
                          if (n.type === "server") return "#3b82f6";
                          if (n.type === "battery") return "#eab308";
                          if (n.type === "inverter") return "#14b8a6";
                          if (n.type === "solar") return "#f97316";
                          if (n.type === "patchpanel") return "#64748b";
                          return "#0ea5e9";
                        }}
                        maskColor={theme === "light" ? "rgba(240,245,255,0.7)" : "rgba(10,15,25,0.7)"}
                        style={{ backgroundColor: theme === "light" ? "#ffffff" : "var(--color-card)" }}
                      />
                    </ReactFlow>

                    {nodes.length === 0 && (
                      <div className="pointer-events-none absolute inset-0 grid place-items-center">
                        <div className="text-center max-w-sm px-6">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Comece agora</div>
                          <h2 className="mt-2 font-display text-xl">Sua topologia está vazia</h2>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Adicione um rack ou switch no canto superior. Arraste do conector inferior de uma câmera até uma porta do switch para criar o link.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  !isFullscreen && (
                    <Diagram3D
                      onBack={() => { setViewMode("2d"); setIsFullscreen(false); }}
                      isFullscreen={false}
                      toggleFullscreen={() => setIsFullscreen(true)}
                    />
                  )
                )}
              </div>
            </>
          )}
        </div>
      </AppShell>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}
