const fs = require('fs');
let content = fs.readFileSync('src/components/Diagram3D.tsx', 'utf8');

// 1. Update racksList
const oldRacksList = '  const racksList = useMemo(() => nodes.filter((n) => n.data.kind === "rack" || n.data.kind === "battery_rack"), [nodes]);';
const newRacksList = `  const racksList = useMemo(() => {
    if (!selectedNode) return [];
    if (selectedNode.data.kind === "stationary_battery") {
      return nodes.filter((n) => n.data.kind === "battery_rack");
    }
    return nodes.filter((n) => n.data.kind === "rack");
  }, [nodes, selectedNode]);`;
content = content.replace(oldRacksList, newRacksList);

// 2. Add occupiedUs useMemo logic
const useMemoLogic = `  const isMountedInRack = selectedNode && selectedNode.data.rackId && selectedNode.data.kind !== "rack";`;
const newMemoLogic = `  const occupiedUs = useMemo(() => {
    if (mountingRackId === "none") return new Map<number, string>();
    const map = new Map<number, string>();
    nodes.forEach(n => {
      if (n.id !== selectedNodeId && n.data.rackId === mountingRackId && n.data.rackUnit !== undefined) {
        const uHeight = n.data.rackUHeight ?? 1;
        for (let i = 0; i < uHeight; i++) {
          map.set(n.data.rackUnit + i, (n.data.name as string) || "Equip");
        }
      }
    });
    return map;
  }, [nodes, mountingRackId, selectedNodeId]);

  const isMountedInRack = selectedNode && selectedNode.data.rackId && selectedNode.data.kind !== "rack";`;
content = content.replace(useMemoLogic, newMemoLogic);

// 3. Update the UI for mountingU to use <select>
const oldInput = `<input
                        type="number"
                        min={1}
                        max={((nodes.find((n) => n.id === mountingRackId)?.data as any)?.units ?? (nodes.find((n) => n.id === mountingRackId)?.data as any)?.shelves ?? 24) - (selectedNode.data.rackUHeight ?? 1) + 1}
                        value={mountingU}
                        onChange={(e) => setMountingU(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                      />`;
const newInput = `<select
                        value={mountingU}
                        onChange={(e) => setMountingU(parseInt(e.target.value) || 1)}
                        className="w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                      >
                        {Array.from({ length: ((nodes.find((n) => n.id === mountingRackId)?.data as any)?.units ?? (nodes.find((n) => n.id === mountingRackId)?.data as any)?.shelves ?? 24) - (selectedNode.data.rackUHeight ?? 1) + 1 }).map((_, i) => {
                          const u = i + 1;
                          let occupiedBy = "";
                          const uHeight = selectedNode.data.rackUHeight ?? 1;
                          for(let j=0; j<uHeight; j++) {
                            if(occupiedUs.has(u+j)) {
                               occupiedBy = occupiedUs.get(u+j)!;
                               break;
                            }
                          }
                          return (
                            <option key={u} value={u} disabled={!!occupiedBy}>
                              U{u} {occupiedBy ? \`(Ocupado: \${occupiedBy})\` : "(Livre)"}
                            </option>
                          );
                        })}
                      </select>`;
content = content.replace(oldInput, newInput);

fs.writeFileSync('src/components/Diagram3D.tsx', content);
console.log('UI updated successfully!');
