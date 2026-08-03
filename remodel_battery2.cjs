const fs = require('fs');

let content = fs.readFileSync('src/components/Diagram3D.tsx', 'utf8');

const startStr = 'function createProceduralStationaryBattery';
const endStr = 'function createProceduralInverter';

let index1 = content.indexOf(startStr);
let index2 = content.indexOf(endStr);

if (index1 !== -1 && index2 !== -1) {
  const part1 = content.substring(0, index1);
  const part2 = content.substring(index2);
  
  const newStationaryBattery = `function createProceduralStationaryBattery(capacity: number, voltage?: number) {
  const group = new THREE.Group();

  const width = capacity >= 150 ? 3.0 : capacity >= 100 ? 2.5 : capacity >= 75 ? 2.0 : 1.6;
  const depth = capacity >= 100 ? 1.4 : 1.1;
  const height = capacity >= 200 ? 2.0 : capacity >= 100 ? 1.7 : 1.4;

  const mat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, metalness: 0.2 });

  // Main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Top cover
  const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, depth), mat);
  top.position.y = height / 2 + 0.1;
  top.castShadow = true;
  group.add(top);
  
  // Handles / indentations (visual detail)
  const handleIndent = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, depth - 0.2), handleIndent);
  h1.position.set(-width/2 + 0.01, 0.2, 0);
  group.add(h1);
  const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, depth - 0.2), handleIndent);
  h2.position.set(width/2 - 0.01, 0.2, 0);
  group.add(h2);

  // Terminals (silver)
  const termGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16);
  const termMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.6 });
  
  const termPos = new THREE.Mesh(termGeo, termMat);
  termPos.position.set(-width * 0.35, height / 2 + 0.2, 0);
  group.add(termPos);

  const termNeg = new THREE.Mesh(termGeo, termMat);
  termNeg.position.set(width * 0.35, height / 2 + 0.2, 0);
  group.add(termNeg);
  
  // Terminal bolts
  const boltGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 6);
  const bolt1 = new THREE.Mesh(boltGeo, termMat);
  bolt1.position.set(-width * 0.35, height / 2 + 0.25, 0);
  group.add(bolt1);
  const bolt2 = new THREE.Mesh(boltGeo, termMat);
  bolt2.position.set(width * 0.35, height / 2 + 0.25, 0);
  group.add(bolt2);

  group.position.y = height / 2;
  return { mesh: group, leds: [] };
}
`;

  const newBatteryRack = `function createProceduralBatteryRack(slots: number) {
  const group = new THREE.Group();
  
  const rackW = 6.0;
  const rackD = 2.0;
  const rackH = 4.8;

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.3, roughness: 0.6 });

  // Frame pillars
  const pillarGeo = new THREE.BoxGeometry(0.2, rackH, 0.2);
  const p1 = new THREE.Mesh(pillarGeo, metalMat); p1.position.set(-rackW/2 + 0.1, rackH/2 + 0.3, rackD/2 - 0.1); p1.castShadow = true; group.add(p1);
  const p2 = new THREE.Mesh(pillarGeo, metalMat); p2.position.set(rackW/2 - 0.1, rackH/2 + 0.3, rackD/2 - 0.1); p2.castShadow = true; group.add(p2);
  const p3 = new THREE.Mesh(pillarGeo, metalMat); p3.position.set(-rackW/2 + 0.1, rackH/2 + 0.3, -rackD/2 + 0.1); p3.castShadow = true; group.add(p3);
  const p4 = new THREE.Mesh(pillarGeo, metalMat); p4.position.set(rackW/2 - 0.1, rackH/2 + 0.3, -rackD/2 + 0.1); p4.castShadow = true; group.add(p4);

  // Shelves
  const shelfGeo = new THREE.BoxGeometry(rackW, 0.15, rackD);
  const bottomShelf = new THREE.Mesh(shelfGeo, metalMat);
  bottomShelf.position.y = 0.3;
  bottomShelf.receiveShadow = true;
  bottomShelf.castShadow = true;
  group.add(bottomShelf);

  const middleShelf = new THREE.Mesh(shelfGeo, metalMat);
  middleShelf.position.y = rackH / 2 + 0.3;
  middleShelf.receiveShadow = true;
  middleShelf.castShadow = true;
  group.add(middleShelf);
  
  // Side and back crossbars for stability
  const barGeo = new THREE.BoxGeometry(rackW, 0.1, 0.1);
  const bBar1 = new THREE.Mesh(barGeo, metalMat); bBar1.position.set(0, rackH/2 + 0.3, -rackD/2 + 0.1); group.add(bBar1);
  const bBar2 = new THREE.Mesh(barGeo, metalMat); bBar2.position.set(0, 0.3, -rackD/2 + 0.1); group.add(bBar2);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
  [ [-1, 1], [1, 1], [-1, -1], [1, -1] ].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(x * (rackW/2 - 0.2), 0.15, z * (rackD/2 - 0.2));
    group.add(wheel);
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), metalMat);
    bracket.position.set(x * (rackW/2 - 0.2), 0.25, z * (rackD/2 - 0.2));
    group.add(bracket);
  });

  // Batteries
  const batWidth = 2.5; 
  for (let s = 0; s < 2; s++) { // 2 shelves
    for (let b = 0; b < 2; b++) { // 2 batteries per shelf
      const bat = createProceduralStationaryBattery(100).mesh;
      bat.position.set(-rackW * 0.22 + b * (rackW * 0.44), (s === 0 ? 0.3 : rackH/2 + 0.3) + 0.075, 0);
      group.add(bat);
    }
  }

  // Cables
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6 });
  const redCableMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });
  
  const createCable = (p1, p2, colorMat = cableMat) => {
    const curve = new THREE.QuadraticBezierCurve3(
      p1,
      new THREE.Vector3((p1.x + p2.x)/2, Math.max(p1.y, p2.y) + 0.6, (p1.z + p2.z)/2),
      p2
    );
    const geo = new THREE.TubeGeometry(curve, 10, 0.04, 8, false);
    return new THREE.Mesh(geo, colorMat);
  };

  const bTopY = (rackH/2 + 0.3) + 0.075 + 1.9; 
  const bBotY = 0.3 + 0.075 + 1.9;
  const bXLeftP = -rackW * 0.22 - batWidth * 0.35;
  const bXLeftN = -rackW * 0.22 + batWidth * 0.35;
  const bXRightP = rackW * 0.22 - batWidth * 0.35;
  const bXRightN = rackW * 0.22 + batWidth * 0.35;

  // Series cables
  group.add(createCable(new THREE.Vector3(bXLeftN, bTopY, 0), new THREE.Vector3(bXRightP, bTopY, 0))); // Top row
  group.add(createCable(new THREE.Vector3(bXLeftN, bBotY, 0), new THREE.Vector3(bXRightP, bBotY, 0))); // Bottom row
  group.add(createCable(new THREE.Vector3(bXRightN, bTopY, 0), new THREE.Vector3(bXRightN, bBotY, 0))); // Connect rows
  
  // Power cables out
  group.add(createCable(new THREE.Vector3(bXLeftP, bTopY, 0), new THREE.Vector3(-rackW/2 - 0.4, bTopY - 0.4, 0), redCableMat));
  group.add(createCable(new THREE.Vector3(bXLeftP, bBotY, 0), new THREE.Vector3(-rackW/2 - 0.4, bTopY - 0.4, 0)));

  // Anderson Connector
  const connector = new THREE.Group();
  const cBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x888888 }));
  connector.add(cBody);
  const cRed = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.38), new THREE.MeshStandardMaterial({ color: 0xcc0000 }));
  cRed.position.set(0, 0.1, 0);
  connector.add(cRed);
  connector.position.set(-rackW/2 - 0.4, bTopY - 0.6, 0);
  group.add(connector);

  group.userData.isBatteryRack = true;
  return { mesh: group, slotHeight: 1, startY: 0 };
}
`;

  const newContent = part1 + newStationaryBattery + "\n" + newBatteryRack + "\n" + part2;
  fs.writeFileSync('src/components/Diagram3D.tsx', newContent);
  console.log("Successfully replaced battery generation functions.");
} else {
  console.log("Could not find function boundaries");
}
