const fs = require('fs');

// Diagram3D.tsx fixes
let d3dPath = 'src/components/Diagram3D.tsx';
let d3dContent = fs.readFileSync(d3dPath, 'utf8');

// Line 1762: loadCustomModelAsync
d3dContent = d3dContent.replace(/loadCustomModelAsync\(node\.id, modelUrl, node\.data\.customModelName \?\? "", isSwitch \? "switch" : "camera", node\.data\.ports \?\? 8\);/g, 'loadCustomModelAsync(node.id, modelUrl, (node.data.customModelName as string) ?? "", isSwitch ? "switch" : "camera", (node.data.ports as number) ?? 8);');

// Line 1870: property 'y' does not exist on type '{}'
// I previously replaced the declaration of pos. Let's make sure it's fully typed.
d3dContent = d3dContent.replace(/const pos = \(d\.position3d as any\) \|\| \{ x: \(nodes\.indexOf\(node\) \* 7\), y: 0, z: -10 \};/g, 'const pos = (d.position3d as any) || { x: (nodes.indexOf(node) * 7), y: 0, z: -10 };');
// I'll just change structGroup.position.set to cast pos
d3dContent = d3dContent.replace(/structGroup\.position\.set\(pos\.x, pos\.y, pos\.z\);/g, 'structGroup.position.set((pos as any).x, (pos as any).y, (pos as any).z);');

fs.writeFileSync(d3dPath, d3dContent);


// BatteryNode.tsx fixes
let batPath = 'src/components/nodes/BatteryNode.tsx';
let batContent = fs.readFileSync(batPath, 'utf8');
batContent = batContent.replace(/\{data\.voltage\}/g, '{(data as any).voltage}');
batContent = batContent.replace(/\{data\.capacityAh\}/g, '{(data as any).capacityAh}');
batContent = batContent.replace(/\{data\.name\}/g, '{(data as any).name}');
fs.writeFileSync(batPath, batContent);


// store.ts fix
let storePath = 'src/lib/store.ts';
let storeContent = fs.readFileSync(storePath, 'utf8');
storeContent = storeContent.replace(/merge: \(persistedState, currentState\) => \{/g, 'merge: (persistedState: any, currentState) => {');
fs.writeFileSync(storePath, storeContent);

console.log('Fixed TS errors.');
