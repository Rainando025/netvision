const fs = require('fs');

let content = fs.readFileSync('src/components/Diagram3D.tsx', 'utf8');

const startStr = 'function createProceduralRack(units: number) {';
const endStr = 'function createProceduralOLT(ponPorts: number, uplinkPorts: number) {';

const index1 = content.indexOf(startStr);
const index2 = content.indexOf(endStr);

if (index1 === -1 || index2 === -1) {
  console.log('Not found');
  process.exit(1);
}

const newRack = `function createProceduralRack(units: number) {
  const group = new THREE.Group();

  const slotHeight = 0.22;
  const rackHeight = units * slotHeight + 0.5;
  const rackWidth = 5.4;
  const rackDepth = 4.0;
  
  // Outer cabinet materials
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, metalness: 0.4, roughness: 0.6 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x151618, metalness: 0.5, roughness: 0.5 });
  const innerRailMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8, roughness: 0.3 });

  // Base and Top
  const base = new THREE.Mesh(new THREE.BoxGeometry(rackWidth, 0.25, rackDepth), metalMat);
  base.position.y = 0.125;
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);

  const topLid = base.clone();
  topLid.position.y = rackHeight - 0.125;
  group.add(topLid);

  // Outer Pillars (Corners)
  const pillarGeo = new THREE.BoxGeometry(0.2, rackHeight - 0.5, 0.2);
  const p1 = new THREE.Mesh(pillarGeo, metalMat);
  p1.position.set(-rackWidth / 2 + 0.1, rackHeight / 2, -rackDepth / 2 + 0.1);
  const p2 = p1.clone(); p2.position.x = rackWidth / 2 - 0.1;
  const p3 = p1.clone(); p3.position.z = rackDepth / 2 - 0.1;
  const p4 = p2.clone(); p4.position.z = rackDepth / 2 - 0.1;
  p1.castShadow = true; p2.castShadow = true; p3.castShadow = true; p4.castShadow = true;
  group.add(p1, p2, p3, p4);

  // Side Panels
  const sideGeo = new THREE.BoxGeometry(0.04, rackHeight - 0.5, rackDepth - 0.4);
  const sideL = new THREE.Mesh(sideGeo, frameMat);
  sideL.position.set(-rackWidth / 2 + 0.02, rackHeight / 2, 0);
  const sideR = sideL.clone(); sideR.position.x = rackWidth / 2 - 0.02;
  group.add(sideL, sideR);

  // Back Panel (with vents)
  const backGeo = new THREE.BoxGeometry(rackWidth - 0.4, rackHeight - 0.5, 0.04);
  const backPanel = new THREE.Mesh(backGeo, frameMat);
  backPanel.position.set(0, rackHeight / 2, -rackDepth / 2 + 0.02);
  group.add(backPanel);
  
  // Back Panel Vents Detail
  const ventMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const backVent = new THREE.Mesh(new THREE.BoxGeometry(rackWidth - 1.0, rackHeight - 1.0, 0.05), ventMat);
  backVent.position.set(0, rackHeight / 2, -rackDepth / 2 + 0.02);
  group.add(backVent);

  // Inner 19" Mounting Rails (Vertical)
  const railGeo = new THREE.BoxGeometry(0.08, rackHeight - 0.5, 0.08);
  const innerWidth = 5.2; // Width inside the rack where devices mount
  const railFL = new THREE.Mesh(railGeo, innerRailMat);
  railFL.position.set(-innerWidth / 2 + 0.16, rackHeight / 2, rackDepth / 2 - 0.25);
  const railFR = railFL.clone(); railFR.position.x = innerWidth / 2 - 0.16;
  const railBL = railFL.clone(); railBL.position.z = -rackDepth / 2 + 0.25;
  const railBR = railBL.clone(); railBR.position.z = -rackDepth / 2 + 0.25;
  group.add(railFL, railFR, railBL, railBR);

  // Front Door with Pivot
  const doorPivot = new THREE.Group();
  // Pivot placed exactly at the front-left outer corner pillar
  doorPivot.position.set(-rackWidth / 2, rackHeight / 2, rackDepth / 2);
  
  const doorWidth = rackWidth;
  const doorHeight = rackHeight - 0.5;
  const doorThickness = 0.08;
  
  // Door frame (metal)
  const frameWidth = 0.3;
  const doorFrameGeo = new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness);
  const doorFrame = new THREE.Mesh(doorFrameGeo, frameMat);
  // Shift the door geometry so its left edge aligns with the pivot (x=0 inside the pivot group)
  doorFrame.position.set(doorWidth / 2, 0, doorThickness / 2);
  doorPivot.add(doorFrame);
  
  // Door glass
  const glassMat = new THREE.MeshStandardMaterial({ 
    color: 0x111111, 
    transparent: true, 
    opacity: 0.6, 
    metalness: 0.8, 
    roughness: 0.1 
  });
  const glassWidth = doorWidth - (frameWidth * 2);
  const glassHeight = doorHeight - (frameWidth * 2);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(glassWidth, glassHeight, doorThickness + 0.01), glassMat);
  glass.position.set(doorWidth / 2, 0, doorThickness / 2);
  doorPivot.add(glass);

  // Door handle (right side of the door)
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), handleMat);
  handle.position.set(doorWidth - 0.15, 0, doorThickness + 0.03);
  doorPivot.add(handle);

  group.add(doorPivot);

  // Decorative LED strip inside the rack (left side)
  const ledStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, rackHeight - 0.6, 0.04), 
    new THREE.MeshBasicMaterial({ color: 0x0ea5e9 })
  );
  ledStrip.position.set(-innerWidth / 2 + 0.2, rackHeight / 2, rackDepth / 2 - 0.3);
  group.add(ledStrip);

  return { mesh: group, doorPivot, slotHeight, startY: 0.25, rackHeight };
}
`;

const newContent = content.substring(0, index1) + newRack + content.substring(index2);
fs.writeFileSync('src/components/Diagram3D.tsx', newContent);
console.log('Rack replaced');
