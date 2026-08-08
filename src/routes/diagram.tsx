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
import { FloorNode } from "@/components/nodes/FloorNode";
import { OltNode } from "@/components/nodes/OltNode";
import { DioNode } from "@/components/nodes/DioNode";
import { RouterNode } from "@/components/nodes/RouterNode";
import { ServerNode } from "@/components/nodes/ServerNode";
import { BatteryRackNode } from "@/components/nodes/BatteryRackNode";
import { StationaryBatteryNode } from "@/components/nodes/StationaryBatteryNode";
import { InverterNode } from "@/components/nodes/InverterNode";
import { RectifierNode } from "@/components/nodes/RectifierNode";
import { SolarNode } from "@/components/nodes/SolarNode";
import { PatchPanelNode } from "@/components/nodes/PatchPanelNode";
import { DwdmNode } from "@/components/nodes/DwdmNode";
import { EciNode } from "@/components/nodes/EciNode";
import { AddDeviceMenu } from "@/components/AddDeviceMenu";
import { Diagram3D } from "@/components/Diagram3D";
import { useDiagram } from "@/lib/store";
import type { NodeData } from "@/lib/types";
import {
  Box, FolderOpen, Folder, Layers, MapPin, Plus, Maximize2, ChevronLeft,
  Trash2, FolderPlus, ChevronRight, ChevronDown, List, LayoutGrid, Network, Search, Zap,
  FileText
} from "lucide-react";
import { DeletableEdge } from "@/components/DeletableEdge";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export const Route = createFileRoute("/diagram")({
  head: () => ({
    meta: [
      { title: "Diagrama de Rede · POP GRID" },
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

  const totalPower = useMemo(() => nodes.reduce((acc, n) => acc + ((n.data as any).powerWatts || 0), 0), [nodes]);
  const totalAmperage = useMemo(() => nodes.reduce((acc, n) => acc + ((n.data as any).amperage || 0), 0), [nodes]);
  const setNodes = useDiagram((s) => s.setNodes);
  const setEdges = useDiagram((s) => s.setEdges);
  const removeNode = useDiagram((s) => s.removeNode);
  const removeEdge = useDiagram((s) => s.removeEdge);
  const createLocation = useDiagram((s) => s.createLocation);
  const deleteLocation = useDiagram((s) => s.deleteLocation);
  const selectLocation = useDiagram((s) => s.selectLocation);

  const handleExportPDF = async () => {
    let wasIn3D = false;
    if (viewMode === "3d") {
      wasIn3D = true;
      setViewMode("2d");
      setIsFullscreen(false);
      // Aguardar a renderização do React Flow
      await new Promise(r => setTimeout(r, 600));
    }

    const element = document.querySelector('.react-flow__viewport') as HTMLElement || document.querySelector('.react-flow') as HTMLElement;
    if (!element) {
      toast.error('Diagrama 2D não encontrado para exportação');
      if (wasIn3D) setViewMode("3d");
      return;
    }

    try {
      // Captura o diagrama 2D
      const dataUrl = await toPng(element, { backgroundColor: theme === 'light' ? '#ffffff' : '#0a0f19' });
      
      const w = window.open('', '_blank');
      if (!w) { toast.error('Não foi possível abrir nova aba para o PDF'); return; }

      const dataStr = new Date().toLocaleString('pt-BR');
      const popName = "Diagrama de Rede";
      const locName = locations[activeLocationId]?.name || popName;

      const equipmentsHtml = nodes.map(n => {
        const d = n.data as any;
        const locationStr = d.rackId 
          ? `Rack U${d.rackUnit}` 
          : (['wall','floor','ceiling','door'].includes(d.kind) ? 'Estrutura' : 'Chão livre');
        const ipStr = d.ip ? d.ip : '-';
        const pwrStr = d.powerWatts ? `${d.powerWatts}W` : '-';
        return `<tr>
          <td><strong>${d.name || 'Sem nome'}</strong></td>
          <td><span class="badge">${d.kind}</span></td>
          <td>${locationStr}</td>
          <td><span style="font-family: monospace;">${ipStr}</span></td>
          <td>${pwrStr}</td>
        </tr>`;
      }).join('');

      // Group connections by source equipment to show clear power distribution
      const sourceMap = new Map<string, { sourceNode: any, targetNodes: any[], labels: string[] }>();
      edges.forEach(e => {
        const sourceNode = nodes.find(n => n.id === e.source);
        const targetNode = nodes.find(n => n.id === e.target);
        if (!sourceNode || !targetNode) return;
        
        if (!sourceMap.has(e.source)) {
          sourceMap.set(e.source, { sourceNode, targetNodes: [], labels: [] });
        }
        sourceMap.get(e.source)!.targetNodes.push(targetNode);
        sourceMap.get(e.source)!.labels.push(e.data?.label ? String(e.data.label) : '-');
      });

      const linksHtml = Array.from(sourceMap.values()).map(item => {
        const srcName = item.sourceNode.data.name || item.sourceNode.id;
        const srcKind = item.sourceNode.data.kind;
        
        const targetsHtml = item.targetNodes.map((tNode, idx) => {
          const tName = tNode.data.name || tNode.id;
          const tKind = tNode.data.kind;
          const label = item.labels[idx];
          const labelPart = label && label !== '-' ? `<span style="font-size: 11px; color: var(--text-muted); font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">ID: ${label}</span>` : '';
          return `<div style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px;">
            <span style="color: #a16207;">⚡ Energia</span>
            <span>&rarr; Alimentando: <strong>${tName}</strong></span>
            <span class="badge" style="font-size: 10px; padding: 2px 8px; background: #f1f5f9; color: #475569;">${tKind}</span>
            ${labelPart}
          </div>`;
        }).join('');
        
        return `<tr>
          <td>
            <strong>${srcName}</strong> 
            <span class="badge power" style="font-size: 10px; padding: 2px 8px; margin-left: 6px;">${srcKind}</span>
          </td>
          <td colspan="3" style="padding: 4px 16px;">
            <div style="display: flex; flex-direction: column;">
              ${targetsHtml}
            </div>
          </td>
        </tr>`;
      }).join('');

      w.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Infraestrutura - ${locName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    :root {
      --primary: #0ea5e9;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --bg-alt: #f8fafc;
    }

    * { box-sizing: border-box; }
    
    body { 
      font-family: 'Inter', sans-serif; 
      color: var(--text);
      line-height: 1.5;
      margin: 0;
      padding: 40px;
      background: #f1f5f9;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }

    .title-block h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      color: var(--text);
    }

    .title-block p {
      margin: 0;
      color: var(--text-muted);
      font-size: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: var(--bg-alt);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 4px;
      font-weight: 600;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--primary);
    }

    .section-title {
      font-size: 20px;
      font-weight: 600;
      margin: 40px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }

    .diagram-container {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 4px;
      background: var(--bg-alt);
      margin-bottom: 32px;
      overflow: hidden;
    }

    .diagram-container img {
      width: 100%;
      height: auto;
      border-radius: 4px;
      display: block;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      margin-bottom: 32px;
    }

    th {
      text-align: left;
      padding: 12px 16px;
      background: var(--bg-alt);
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.05em;
      border-bottom: 2px solid var(--border);
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--text);
    }

    tr:last-child td { border-bottom: none; }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: #e0f2fe;
      color: #0369a1;
      text-transform: capitalize;
    }

    .badge.power {
      background: #fef9c3;
      color: #a16207;
    }

    .controls {
      position: fixed;
      bottom: 32px;
      right: 32px;
      display: flex;
      gap: 12px;
      z-index: 100;
    }

    .btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      border: none;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      transition: transform 0.2s;
    }

    .btn:hover { transform: translateY(-2px); }
    .btn-primary { background: var(--primary); color: white; }
    .btn-secondary { background: white; color: var(--text); border: 1px solid var(--border); }

    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; padding: 0; max-width: 100%; border: none; }
      .controls { display: none !important; }
      .diagram-container { page-break-inside: avoid; border: none; background: transparent; padding: 0; }
      .stats-grid { gap: 10px; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
      .stat-card { padding: 12px; }
      .stat-value { font-size: 18px; }
      .stat-label { font-size: 10px; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      th { background: #f8fafc !important; }
      @page { margin: 1cm; size: auto; }
    }
  </style>
</head>
<body>
  <div class="controls no-print">
    <button class="btn btn-secondary" onclick="window.close()">
      Fechar
    </button>
    <button class="btn btn-primary" onclick="window.print()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      Imprimir / Salvar PDF
    </button>
  </div>

  <div class="container">
    <div class="header">
      <div class="title-block">
        <h1>Relatório de Infraestrutura</h1>
        <p>Localidade: <strong>${locName}</strong></p>
      </div>
      <div style="text-align: right; color: var(--text-muted); font-size: 14px;">
        Gerado em<br/><strong>${dataStr}</strong>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Equipamentos</div>
        <div class="stat-value">${nodes.filter((n: any) => !['wall', 'door', 'lamp', 'ceiling', 'floor'].includes(n.data.kind as string)).length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Conexões</div>
        <div class="stat-value">${edges.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Consumo (Watts)</div>
        <div class="stat-value">${totalPower} W</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Corrente (Amperes)</div>
        <div class="stat-value">${totalAmperage.toFixed(1)} A</div>
      </div>
    </div>

    <div class="section-title">Diagrama 2D</div>
    <div class="diagram-container">
      <img src="${dataUrl}" alt="Diagrama 2D" />
    </div>

    <div class="section-title">Inventário de Equipamentos</div>
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Tipo</th>
          <th>Localização</th>
          <th>Endereço IP</th>
          <th>Consumo</th>
        </tr>
      </thead>
      <tbody>
        ${equipmentsHtml || '<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">Nenhum equipamento cadastrado.</td></tr>'}
      </tbody>
    </table>

    <div class="section-title">Mapa de Conexões (Distribuição de Energia)</div>
    <table>
      <thead>
        <tr>
          <th>Equipamento Origem</th>
          <th colspan="3">Distribuição / Cargas Alimentadas</th>
        </tr>
      </thead>
      <tbody>
        ${linksHtml || '<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">Nenhuma ligação de energia cadastrada.</td></tr>'}
      </tbody>
    </table>
  </div>
</body>
</html>`);
      w.document.close();
      if (wasIn3D) {
        setViewMode("3d");
      }
    } catch (e) {
      toast.error('Erro ao capturar diagrama 2D');
      if (wasIn3D) setViewMode("3d");
    }
  };

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
    floor: FloorNode,
    olt: OltNode,
    dio: DioNode,
    router: RouterNode,
    server: ServerNode,
    battery_rack: BatteryRackNode,
    stationary_battery: StationaryBatteryNode,
    inverter: InverterNode,
    rectifier: RectifierNode,
    solar: SolarNode,
    patchpanel: PatchPanelNode,
    dwdm: DwdmNode,
    eci: EciNode,
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
      const isPower = true;
      let className = offline ? "offline" : "power-cable animated";
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
                    {totalPower > 0 && (
                      <div className="flex items-center gap-1.5 pl-4 border-l border-border/40">
                        <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Consumo</div>
                          <div className="font-display text-base font-semibold text-yellow-500">{totalPower}W{totalAmperage > 0 ? ` / ${totalAmperage.toFixed(1)}A` : ""}</div>
                        </div>
                      </div>
                    )}
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
                  
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 ml-2 rounded-md bg-primary/10 text-primary border border-primary/30 shadow-sm hover:bg-primary/20 transition text-[10px] font-semibold uppercase tracking-wider"
                    title="Exportar Relatório e Diagrama 2D"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Relatório
                  </button>
                </div>
              </div>

              <div className="relative flex-1 mx-6 md:mx-8 mb-6 md:mb-8 rounded-2xl overflow-hidden">
                <AddDeviceMenu />

                {viewMode === "2d" ? (
                  <div className="relative w-full h-full border border-border/60 rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--color-background)" }}>
                    <ReactFlow
                      nodes={nodes.filter(n => !['wall', 'floor', 'ceiling', 'door', 'lamp'].includes((n.data as NodeData).kind))}
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
