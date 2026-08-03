const fs = require('fs');

let content = fs.readFileSync('src/components/Diagram3D.tsx', 'utf8');

const startStr = 'function createProceduralSwitch(ports: number, activePortsCount: number) {';
const endStr = 'function createProceduralCamera(type: string) {';

const index1 = content.indexOf(startStr);
const index2 = content.indexOf(endStr);

if (index1 === -1 || index2 === -1) {
  console.log('Not found', index1, index2);
  process.exit(1);
}

const newSwitch = `function createProceduralSwitch(ports: number, activePortsCount: number) {
  const group = new THREE.Group();

  const width = 5.2;
  const depth = 2.4;
  const height = 0.88;

  // Main chassis
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111314, metalness: 0.2, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Top heat-dissipation fins
  const finMat = new THREE.MeshStandardMaterial({ color: 0x0d0f10, metalness: 0.15, roughness: 0.6 });
  const numFins = 18;
  for (let i = 0; i < numFins; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.04, 0.04), finMat);
    fin.position.set(0, height / 2 + 0.02, -depth / 2 + 0.08 + i * (depth * 0.82 / numFins));
    group.add(fin);
  }

  // Rack ears
  const earMat = new THREE.MeshStandardMaterial({ color: 0x1a1d20, metalness: 0.3, roughness: 0.4 });
  for (let side = -1; side <= 1; side += 2) {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.32, height + 0.06, 0.28), earMat);
    ear.position.set(side * (width / 2 + 0.16), 0, depth / 2 - 0.14);
    ear.castShadow = true;
    group.add(ear);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x050607 });
    const hole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.06), holeMat);
    hole.position.set(side * (width / 2 + 0.16), 0, depth / 2 - 0.01);
    group.add(hole);
  }

  // Front face panel
  const faceMat = new THREE.MeshStandardMaterial({ color: 0x0d0f10, metalness: 0.15, roughness: 0.45 });
  const face = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, height - 0.04, 0.04), faceMat);
  face.position.z = depth / 2 + 0.02;
  group.add(face);

  // Green power terminal block (left)
  const termGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5, metalness: 0.1 });
  const termBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.06), termGreenMat);
  termBody.position.set(-width / 2 + 0.22, -0.08, depth / 2 + 0.05);
  group.add(termBody);
  const screwMat = new THREE.MeshStandardMaterial({ color: 0xd4d8dc, roughness: 0.2, metalness: 0.7 });
  for (let t = 0; t < 4; t++) {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 8), screwMat);
    screw.rotation.x = Math.PI / 2;
    screw.position.set(-width / 2 + 0.12 + (t % 2) * 0.11, -0.04 + Math.floor(t / 2) * -0.1, depth / 2 + 0.09);
    group.add(screw);
  }

  // 24 RJ45 ports in 2 rows of 12
  const portsPerRow = Math.min(Math.ceil(ports / 2), 12);
  const cols = portsPerRow;
  const spacingX = (width * 0.64) / cols;
  const startX = -width * 0.17;
  const portBodyMat = new THREE.MeshStandardMaterial({ color: 0x060708, roughness: 0.9 });
  const portBorderMat = new THREE.MeshStandardMaterial({ color: 0x1e2225, roughness: 0.6, metalness: 0.15 });
  const activeLedMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
  const linkLedMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const inactiveLedMat = new THREE.MeshBasicMaterial({ color: 0x1a1d20 });
  const ledObjects = [];

  for (let row = 0; row < 2; row++) {
    const rowY = row === 0 ? 0.1 : -0.1;
    for (let col = 0; col < cols; col++) {
      const portIdx = row * cols + col;
      const pX = startX + col * spacingX;
      const pZ = depth / 2 + 0.045;

      const border = new THREE.Mesh(new THREE.BoxGeometry(spacingX * 0.82, 0.19, 0.01), portBorderMat);
      border.position.set(pX, rowY, pZ);
      group.add(border);

      const port = new THREE.Mesh(new THREE.BoxGeometry(spacingX * 0.68, 0.13, 0.02), portBodyMat);
      port.position.set(pX, rowY - 0.012, pZ + 0.005);
      group.add(port);

      const isActive = portIdx < activePortsCount;
      const actLed = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.008), isActive ? activeLedMat : inactiveLedMat);
      actLed.position.set(pX - 0.022, rowY + 0.1, pZ + 0.005);
      group.add(actLed);
      if (isActive) ledObjects.push(actLed);

      const lnkLed = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.008), isActive ? linkLedMat : inactiveLedMat);
      lnkLed.position.set(pX + 0.022, rowY + 0.1, pZ + 0.005);
      group.add(lnkLed);
    }
  }

  // SFP uplink ports (right)
  const sfpMat = new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.7 });
  const sfpCageMat = new THREE.MeshStandardMaterial({ color: 0x252a2e, metalness: 0.3, roughness: 0.4 });
  for (let s = 0; s < 2; s++) {
    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.05), sfpCageMat);
    cage.position.set(width / 2 - 0.45, 0.1 - s * 0.22, depth / 2 + 0.045);
    group.add(cage);
    const hole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.04), sfpMat);
    hole.position.set(width / 2 - 0.45, 0.1 - s * 0.22, depth / 2 + 0.055);
    group.add(hole);
    const sfpLed = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.008), activeLedMat);
    sfpLed.position.set(width / 2 - 0.32, 0.1 - s * 0.22, depth / 2 + 0.05);
    group.add(sfpLed);
    ledObjects.push(sfpLed);
  }

  // Power LED
  const pwrLed = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.008), new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
  pwrLed.position.set(width / 2 - 0.22, 0.18, depth / 2 + 0.05);
  group.add(pwrLed);

  const sysLed = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.008), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
  sysLed.position.set(width / 2 - 0.22, 0.1, depth / 2 + 0.05);
  group.add(sysLed);

  // Console port
  const consolePort = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.04), sfpMat);
  consolePort.position.set(width / 2 - 0.18, -0.14, depth / 2 + 0.04);
  group.add(consolePort);

  return { mesh: group, leds: ledObjects };
}

`;

const newContent = content.substring(0, index1) + newSwitch + content.substring(index2);
fs.writeFileSync('src/components/Diagram3D.tsx', newContent);
console.log('Switch model replaced successfully');
