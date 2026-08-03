const fs = require('fs');

let content = fs.readFileSync('src/components/Diagram3D.tsx', 'utf8');

const startStr1 = 'function createProceduralStationaryBattery(capacity: number, voltage?: number) {';
const startStr2 = 'function createProceduralBatteryRack(slots: number) {';
const endStr2 = 'function createProceduralInverter(powerWatts: number) {';

let index1 = content.indexOf(startStr1);
let index2 = content.indexOf(startStr2);
let index3 = content.indexOf(endStr2);

if (index1 !== -1 && index2 !== -1 && index3 !== -1) {
  const part1 = content.substring(0, index1);
  const part2 = content.substring(index3);
  
  const newStationaryBattery = `function createProceduralStationaryBattery(capacity: number, voltage?: number) {
  const group = new THREE.Group();

  // Size scales with capacity
  const width = capacity >= 150 ? 2.8 : capacity >= 100 ? 2.3 : capacity >= 75 ? 1.8 : 1.5;
  const depth = capacity >= 100 ? 1.6 : 1.3;
  const height = capacity >= 200 ? 2.2 : capacity >= 100 ? 1.9 : 1.6;

  // Moura style - main body (black)
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7, metalness: 0.2 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Top cover
  const topMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.6, metalness: 0.2 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, 0.2, depth + 0.05), topMat);
  top.position.y = height / 2 + 0.1;
  top.castShadow = true;
  group.add(top);

  // Handle (integrated)
  const handleGeo = new THREE.BoxGeometry(width * 0.4, 0.1, 0.25);
  const handle = new THREE.Mesh(handleGeo, topMat);
  handle.position.y = height / 2 + 0.25;
  group.add(handle);

  // Front Label (Moura style - mostly white with some blue/yellow)
  const labelGroup = new THREE.Group();
  
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const blueMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });

  // Main white label front
  const labelBase = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, height * 0.6, 0.02), whiteMat);
  labelBase.position.z = depth / 2 + 0.01;
  labelGroup.add(labelBase);

  // Blue diagonal/stripe on front
  const blueStripe = new THREE.Mesh(new THREE.BoxGeometry(width * 0.35, height * 0.6, 0.021), blueMat);
  blueStripe.position.set(-width * 0.25, 0, depth / 2 + 0.01);
  labelGroup.add(blueStripe);

  // Yellow stripe on front
  const yellowStripe = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, height * 0.15, 0.022), yellowMat);
  yellowStripe.position.set(0, height * 0.2, depth / 2 + 0.01);
  labelGroup.add(yellowStripe);

  group.add(labelGroup);

  // Top Label
  const topLabelGroup = new THREE.Group();
  const topLabel = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 0.01, depth * 0.45), whiteMat);
  topLabel.position.set(-width * 0.15, height / 2 + 0.21, 0);
  topLabelGroup.add(topLabel);
  
  const topYellow = new THREE.Mesh(new THREE.BoxGeometry(width * 0.15, 0.011, depth * 0.45), yellowMat);
  topYellow.position.set(-width * 0.32, height / 2 + 0.21, 0);
  topLabelGroup.add(topYellow);
  
  group.add(topLabelGroup);

  // Terminals (silver)
  const termGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.25, 16);
  const termMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.6 });
  
  const termPos = new THREE.Mesh(termGeo, termMat);
  termPos.position.set(-width * 0.4, height / 2 + 0.25, depth * 0.3);
  group.add(termPos);

  const termNeg = new THREE.Mesh(termGeo, termMat);
  termNeg.position.set(width * 0.4, height / 2 + 0.25, depth * 0.3);
  group.add(termNeg);

  group.position.y = height / 2;
  return { mesh: group, leds: [] };
}
`;

  const newBatteryRack = `function createProceduralBatteryRack(slots: number) {
  const group = new THREE.Group();
  
  // Custom dimensions for slanted open rack
  const rackW = 8.5; // Wide enough for 3 batteries
  const rackD = 3.8; // Bottom depth
  const rackH = 5.6; // Total height
  const topD = rackD * 0.6; // Top depth

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.2, roughness: 0.4 });

  // Draw slanted side panel using Shape
  const sideShape = new THREE.Shape();
  sideShape.moveTo(0, 0);
  sideShape.lineTo(rackD, 0); // Bottom depth
  sideShape.lineTo(rackD, rackH); // Back height
  sideShape.lineTo(rackD - topD, rackH); // Top depth (slanted front)
  sideShape.lineTo(0, 0); // Close shape

  const extrudeSettings = { depth: 0.1, bevelEnabled: false };
  const sideGeo = new THREE.ExtrudeGeometry(sideShape, extrudeSettings);

  const sideL = new THREE.Mesh(sideGeo, metalMat);
  sideL.rotation.y = Math.PI / 2;
  sideL.position.set(-rackW / 2, 0, rackD / 2);
  sideL.castShadow = true;
  sideL.receiveShadow = true;
  group.add(sideL);

  const sideR = new THREE.Mesh(sideGeo, metalMat);
  sideR.rotation.y = Math.PI / 2;
  sideR.position.set(rackW / 2 - 0.1, 0, rackD / 2);
  sideR.castShadow = true;
  sideR.receiveShadow = true;
  group.add(sideR);

  // Back panel
  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(rackW, rackH, 0.1), metalMat);
  backPanel.position.set(0, rackH / 2, -rackD / 2 + 0.05);
  backPanel.receiveShadow = true;
  group.add(backPanel);

  // Shelves
  const shelfThickness = 0.15;
  const bottomShelf = new THREE.Mesh(new THREE.BoxGeometry(rackW, shelfThickness, rackD), metalMat);
  bottomShelf.position.set(0, shelfThickness / 2, 0);
  bottomShelf.receiveShadow = true;
  bottomShelf.castShadow = true;
  group.add(bottomShelf);

  const middleShelfD = rackD - (rackD - topD) * 0.5; // Middle depth based on slant
  const middleShelf = new THREE.Mesh(new THREE.BoxGeometry(rackW, shelfThickness, middleShelfD), metalMat);
  middleShelf.position.set(0, rackH / 2, -rackD/2 + middleShelfD/2);
  middleShelf.receiveShadow = true;
  middleShelf.castShadow = true;
  group.add(middleShelf);

  // Add Batteries (Moura style instances)
  const addBatteriesToShelf = (shelfY, shelfDepthOffset) => {
    for (let i = 0; i < 3; i++) {
      const bat = createProceduralStationaryBattery(100).mesh;
      bat.position.set(-rackW * 0.28 + i * (rackW * 0.28), shelfY + shelfThickness / 2, shelfDepthOffset);
      group.add(bat);
    }
  };

  // Add 3 batteries to bottom shelf
  addBatteriesToShelf(0, 0);
  
  // Add 3 batteries to middle shelf
  addBatteriesToShelf(rackH / 2, -rackD/2 + middleShelfD/2);

  group.userData.isBatteryRack = true;
  return group;
}
`;

  const newContent = part1 + newStationaryBattery + "\n" + newBatteryRack + "\n" + part2;
  fs.writeFileSync('src/components/Diagram3D.tsx', newContent);
  console.log("Successfully replaced battery generation functions.");
} else {
  console.log("Could not find function boundaries");
}
