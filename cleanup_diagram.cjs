const fs = require('fs');

let content = fs.readFileSync('src/components/Diagram3D.tsx', 'utf8');
const lines = content.split('\n');

// Remove lines 1234-1263 (0-indexed: 1233 to 1262) which are the duplicated state declarations
// Lines 1234-1263 in 1-indexed means index 1233 to 1262 in 0-indexed
// From the view: lines 1233-1261 are the duplicated block (the one added by bad edit)
// We need to remove:
// Line 1233 (0-indexed 1232): `  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);`
// Lines 1234-1261 (0-indexed 1233-1260): the entire duplicated state block from there up to the first useEffect in the duplicate

// Let's find and remove the duplicate block
// The duplicate starts with: `  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);`
// then duplicates all state vars through `const setSelectedNodeIdRef`
// and ends before `const selectedNode = useMemo`

// Find duplicate
const dupStart = '  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);\n\n  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);\n  const [editingName, setEditingName] = useState("");\n  const [editingIp, setEditingIp] = useState("");\n  const [mountingRackId, setMountingRackId] = useState("");\n  const [mountingU, setMountingU] = useState(1);\n  const [positionX, setPositionX] = useState(0);\n  const [positionY, setPositionY] = useState(0);\n  const [positionZ, setPositionZ] = useState(0);\n  const [rotationY, setRotationY] = useState(0);\n  const [sceneVersion, setSceneVersion] = useState(0);\n\n  const [openDoors, setOpenDoors] = useState<Set<string>>(new Set());\n\n  const sceneRef = useRef<THREE.Scene | null>(null);\n  const threeNodesRef = useRef<Map<string, THREE.Group>>(new Map());\n  const ledObjectsRef = useRef<Map<string, THREE.Mesh[]>>(new Map());\n  const cablesRef = useRef<THREE.Line[]>([]);\n  const cablePulsesRef = useRef<{ line: THREE.Line; progress: number; speed: number; mesh: THREE.Mesh }[]>([]);\n  const doorPivotsRef = useRef<Map<string, THREE.Group>>(new Map());\n  const doorAnimRef = useRef<Map<string, { target: number; current: number }>>(new Map());\n  const loadingUrlsRef = useRef<Set<string>>(new Set());\n\n  const updateNodeDataRef = useRef(updateNodeData);\n  const setSelectedNodeIdRef = useRef(setSelectedNodeId);\n  useEffect(() => { updateNodeDataRef.current = updateNodeData; }, [updateNodeData]);\n  useEffect(() => { setSelectedNodeIdRef.current = setSelectedNodeId; }, [setSelectedNodeId]);\n\n  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);';

if (content.includes(dupStart)) {
  content = content.replace(dupStart, '  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);');
  console.log('Removed duplicate state block.');
} else {
  console.log('Duplicate block not found by exact match, trying partial...');
}

// Also fix the mixed-in GLTF code in animation loop (lines 1669-1681)
// The bad lines look like:
// `          const name = selectedNode...` inside the animation loop
const badGltfInLoop = `           pulse.mesh.visible = true;\n          const name = selectedNode ? \`\${selectedNode.data.name || 'model'}-selected.glb\` : \`scene-\${Date.now()}.glb\`;\r\n          a.download = name;\r\n          a.click();\r\n          URL.revokeObjectURL(url);\r\n          toast.success('Exportação concluída.');\r\n        },\r\n        { binary: asBinary, onlyVisible: false, truncateDrawRange: false }\r\n      );\r\n    } catch (err) {\r\n      console.error(err);\r\n      toast.error('Erro ao exportar');\r\n    }\r\n  };\r\n`;

const fixedLoop = `           pulse.mesh.visible = true;\n        }\n`;

if (content.includes(badGltfInLoop)) {
  content = content.replace(badGltfInLoop, fixedLoop);
  console.log('Fixed mixed-in GLTF code in animation loop.');
} else {
  console.log('Bad GLTF mix not found by exact match.');
  // Try to find it differently
  const lines2 = content.split('\n');
  lines2.forEach((l, i) => {
    if (l.includes("'Exportação concluída.'")) console.log(`Line ${i+1}:`, l);
  });
}

// Fix connectMode reference in handleMouseDown (if missing)
if (!content.includes('connectMode')) {
  content = content.replace(
    'const addEdge = useDiagram((s) => s.addEdge);',
    `const addEdge = useDiagram((s) => s.addEdge);
  const [connectMode, setConnectMode] = useState(false);`
  );
  console.log('Added connectMode state.');
} else {
  console.log('connectMode already present.');
}

fs.writeFileSync('src/components/Diagram3D.tsx', content);
console.log('Done. Lines:', content.split('\n').length);
