const fs = require('fs');

let content = fs.readFileSync('src/components/Diagram3D.tsx', 'utf8');

// 1. Add Zap icon
content = content.replace(/import \{([^}]+)\} from "lucide-react";/, (match, imports) => {
  if (!imports.includes("Zap")) return `import { ${imports}, Zap } from "lucide-react";`;
  return match;
});

// 2. Add addEdge and connect states
content = content.replace(/const removeNode = useDiagram\(\(s\) => s\.removeNode\);/, `const removeNode = useDiagram((s) => s.removeNode);
  const addEdge = useDiagram((s) => s.addEdge);
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);`);

// 3. Update pulse tick logic
content = content.replace(/const geo = pulse\.line\.geometry as THREE\.BufferGeometry;[\s\S]*?pulse\.mesh\.visible = true;\s*\}/, `const curve = pulse.mesh.userData.curve;
        if (curve) {
           const pt = curve.getPointAt(pulse.progress);
           pulse.mesh.position.copy(pt);
           pulse.mesh.visible = true;
        }`);

// 4. Update handleMouseDown for connectMode
content = content.replace(/const nodeId = hits\[0\]\.object\.userData\.nodeId as string;/, `const nodeId = hits[0].object.userData.nodeId as string;
        
        if (connectMode) {
          e.stopPropagation();
          if (!connectSourceId) {
            setConnectSourceId(nodeId);
            toast.info("Agora clique no equipamento de destino.");
          } else {
            if (connectSourceId !== nodeId) {
              const newEdgeId = \`e-\${connectSourceId}-\${nodeId}-\${Date.now()}\`;
              addEdge({ id: newEdgeId, source: connectSourceId, target: nodeId });
              toast.success("Equipamentos conectados!");
            }
            setConnectMode(false);
            setConnectSourceId(null);
          }
          return;
        }`);

// 5. Update Pass 4: Cables rendering
const oldCables = `      const path = new THREE.CurvePath<THREE.Vector3>();
      const src = getEscapePath(p1, sourceNode);
      const tgt = getEscapePath(p2, targetNode);

      if (sourceNode?.data?.rackId) path.add(new THREE.LineCurve3(p1.clone(), src.pEscape));
      path.add(new THREE.LineCurve3(src.pEscape, src.pFloor));
      path.add(new THREE.LineCurve3(src.pFloor, tgt.pFloor));
      path.add(new THREE.LineCurve3(tgt.pFloor, tgt.pEscape));
      if (targetNode?.data?.rackId) path.add(new THREE.LineCurve3(tgt.pEscape, p2.clone()));

      const points = path.getSpacedPoints(64);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const isOffline = sourceNode?.data.status === "offline" || targetNode?.data.status === "offline";

      const lineMat = new THREE.LineBasicMaterial({ color: isOffline ? 0xef4444 : 0x06b6d4, linewidth: 2 });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      cablesRef.current.push(line);

      if (!isOffline) {
        const pulseMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee })
        );
        scene.add(pulseMesh);
        cablePulsesRef.current.push({ line, progress: Math.random(), speed: 0.8 + Math.random() * 0.4, mesh: pulseMesh });
      }`;

const newCables = `      const src = getEscapePath(p1, sourceNode);
      const tgt = getEscapePath(p2, targetNode);

      const pathPoints = [];
      if (sourceNode?.data?.rackId) pathPoints.push(p1.clone(), src.pEscape);
      else pathPoints.push(p1.clone());
      
      const midPoint = new THREE.Vector3().lerpVectors(src.pFloor, tgt.pFloor, 0.5);
      midPoint.y = -0.1; // sagging
      
      pathPoints.push(src.pFloor, midPoint, tgt.pFloor);

      if (targetNode?.data?.rackId) pathPoints.push(tgt.pEscape, p2.clone());
      else pathPoints.push(p2.clone());
      
      const curve = new THREE.CatmullRomCurve3(pathPoints, false, "chordal", 0.5);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.04, 8, false);
      
      const isOffline = sourceNode?.data.status === "offline" || targetNode?.data.status === "offline";
      const isPower = sourceNode?.data.kind === "stationary_battery" || targetNode?.data.kind === "stationary_battery" || sourceNode?.data.kind === "battery_rack" || targetNode?.data.kind === "battery_rack" || sourceNode?.data.kind === "inverter" || targetNode?.data.kind === "inverter" || sourceNode?.data.kind === "solar" || targetNode?.data.kind === "solar";
      const tubeMat = new THREE.MeshStandardMaterial({ 
         color: isOffline ? 0xb91c1c : (isPower ? 0xeab308 : 0xf97316), 
         roughness: 0.8,
         metalness: 0.1
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tube);
      cablesRef.current.push(tube);

      if (!isOffline) {
        const pulseMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee })
        );
        pulseMesh.userData.curve = curve;
        scene.add(pulseMesh);
        // Cast tube as any since the array expects line: THREE.Line
        cablePulsesRef.current.push({ line: tube as any, progress: Math.random(), speed: 0.8 + Math.random() * 0.4, mesh: pulseMesh });
      }`;

content = content.replace(oldCables, newCables);

// 6. Add UI button
const oldButton = `<button
          onClick={addQuickRack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary/10 text-primary border border-primary/40 shadow-md hover:bg-primary/20 transition text-xs font-semibold uppercase tracking-wider glow-cyan"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Rack 3D
        </button>`;

const newButton = `<button
          onClick={addQuickRack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary/10 text-primary border border-primary/40 shadow-md hover:bg-primary/20 transition text-xs font-semibold uppercase tracking-wider glow-cyan"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Rack 3D
        </button>
        <button
          onClick={() => { setConnectMode(!connectMode); setConnectSourceId(null); }}
          className={\`flex items-center gap-2 px-3.5 py-2 rounded-lg border shadow-md transition text-xs font-semibold uppercase tracking-wider \${connectMode ? "bg-amber-500/20 border-amber-500/50 text-amber-500" : "bg-card text-card-foreground border-border hover:bg-secondary"}\`}
        >
          <Zap className="w-3.5 h-3.5" />
          {connectMode ? (connectSourceId ? "Cancelar" : "Ligar (Clique Origem)") : "Ligar"}
        </button>`;

content = content.replace(oldButton, newButton);

fs.writeFileSync('src/components/Diagram3D.tsx', content);
console.log('Diagram3D updated for cables and connect mode.');
