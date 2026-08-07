import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { useDiagram } from "@/lib/store";
import type { Node, Edge } from "@xyflow/react";
import type { NodeData, SwitchNodeData, CameraNodeData, RackNodeData, WallNodeData, LampNodeData } from "@/lib/types";
import {
  HardDrive,
  Network,
  Camera,
  Layers,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  X,
  Cpu,
  Move,
  Settings,
  Zap,
  DoorOpen,
  ArrowUpFromLine,
  Maximize2,
  Minimize2,
  Activity,
  Router,
  Server,
  ChevronUp,
  ChevronDown,
  Eye,
  Compass,
} from "lucide-react";
import { toast } from "sonner";

// â”€â”€â”€ Procedural Geometry Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function createTextSprite(text: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Sprite();

  const fontSize = 56;
  context.font = `bold ${fontSize}px sans-serif`;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);

  const scaleFactor = 2;
  canvas.width = (textWidth + 80) * scaleFactor;
  canvas.height = (fontSize + 48) * scaleFactor;

  context.scale(scaleFactor, scaleFactor);

  // Background
  context.fillStyle = "rgba(10, 25, 47, 0.95)";
  context.beginPath();
  context.roundRect(4, 4, textWidth + 72, fontSize + 40, 14);
  context.fill();

  // Cyber Border
  context.lineWidth = 4;
  context.strokeStyle = "#38bdf8";
  context.stroke();

  // Text
  context.fillStyle = "#ffffff";
  context.font = `bold ${fontSize}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, (textWidth + 80) / 2, (fontSize + 48) / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.renderOrder = 999;
  sprite.scale.set((textWidth + 80) * 0.012, (fontSize + 48) * 0.012, 1);
  return sprite;
}

function createSmallTextSprite(text: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Sprite();

  const fontSize = 38;
  context.font = `bold ${fontSize}px sans-serif`;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);

  const scaleFactor = 2;
  canvas.width = (textWidth + 40) * scaleFactor;
  canvas.height = (fontSize + 20) * scaleFactor;

  context.scale(scaleFactor, scaleFactor);

  // Background
  context.fillStyle = "rgba(10, 25, 47, 0.92)";
  context.beginPath();
  context.roundRect(2, 2, textWidth + 36, fontSize + 16, 9);
  context.fill();

  // Border
  context.lineWidth = 2.5;
  context.strokeStyle = "#38bdf8";
  context.stroke();

  // Text
  context.fillStyle = "#f0f9ff";
  context.font = `bold ${fontSize}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, (textWidth + 40) / 2, (fontSize + 20) / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.renderOrder = 999;
  // World-scale: legível dentro do rack
  sprite.scale.set((textWidth + 40) * 0.009, (fontSize + 20) * 0.009, 1);
  return sprite;
}



function createProceduralSwitch(ports: number, activePortsCount: number) {
  const group = new THREE.Group();

  const width = 5.2;
  const depth = 1.8;
  const height = 0.55;

  // Main chassis
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.2, roughness: 0.5 });
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

function createProceduralCamera(type: string) {
  const group = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf0f2f4, roughness: 0.5, metalness: 0.04 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.65, metalness: 0.12 });
  const grayMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.35, metalness: 0.25 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.02, metalness: 0.15, transparent: true, opacity: 0.92 });
  const lensRingMat = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.12, metalness: 0.35 });

  if (type === "Dome") {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.14, 24), whiteMat);
    base.receiveShadow = true; group.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.035, 8, 28), grayMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.09; group.add(ring);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, transparent: true, opacity: 0.7, roughness: 0.02 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.46, 22, 22, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.y = 0.02; dome.rotation.x = Math.PI; group.add(dome);
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.18, 14), darkMat);
    housing.position.y = -0.04; group.add(housing);
    const lensR = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.06, 14), lensRingMat);
    lensR.position.y = -0.12; group.add(lensR);
    const lg = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), glassMat);
    lg.position.y = -0.15; lg.rotation.x = -Math.PI / 2; group.add(lg);
    const sled = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    sled.position.set(0.48, 0.09, 0); group.add(sled);
  } else if (type === "PTZ") {
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.16, 18), grayMat);
    group.add(pedestal);
    const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.14, 18), darkMat);
    yoke.position.y = 0.15; group.add(yoke);
    const housing = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.66), whiteMat);
    housing.position.y = 0.24; housing.rotation.x = Math.PI; group.add(housing);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.05), darkMat);
    bezel.position.set(0, 0.3, 0.32); group.add(bezel);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.14, 14), lensRingMat);
    (lens.geometry as THREE.BufferGeometry).rotateX(Math.PI / 2);
    lens.position.set(0, 0.3, 0.41); group.add(lens);
    const lg = new THREE.Mesh(new THREE.CircleGeometry(0.06, 14), glassMat);
    lg.position.set(0, 0.3, 0.48); group.add(lg);
  } else if (type === "Fisheye") {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.62, 0.22, 20), whiteMat);
    group.add(base);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.14, 20), darkMat);
    barrel.position.y = 0.16; group.add(barrel);
    const fisheye = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.52), glassMat);
    fisheye.position.y = 0.2; fisheye.rotation.x = Math.PI; group.add(fisheye);
  } else {
    // BULLET IP CAMERA - Intelbras VIP style
    const bracketDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.075, 30), whiteMat);
    bracketDisc.rotation.x = Math.PI / 2;
    bracketDisc.position.z = -1.52;
    bracketDisc.castShadow = true; group.add(bracketDisc);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.085, 10), grayMat);
      screw.rotation.x = Math.PI / 2;
      screw.position.set(Math.cos(angle) * 0.34, Math.sin(angle) * 0.34, -1.515);
      group.add(screw);
    }
    const grommet = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.09, 12), darkMat);
    grommet.rotation.x = Math.PI / 2; grommet.position.z = -1.52; group.add(grommet);
    const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), whiteMat);
    pivot.position.z = -1.08; group.add(pivot);
    const armGeo = new THREE.CylinderGeometry(0.072, 0.082, 0.6, 14);
    (armGeo as THREE.BufferGeometry).rotateX(Math.PI / 2);
    const arm = new THREE.Mesh(armGeo, whiteMat);
    arm.position.z = -0.78; group.add(arm);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.13, 16), grayMat);
    collar.rotation.x = Math.PI / 2; collar.position.z = -0.46; group.add(collar);
    const bodyGeo = new THREE.CylinderGeometry(0.235, 0.265, 1.08, 22);
    (bodyGeo as THREE.BufferGeometry).rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, whiteMat);
    body.position.z = 0.14; body.castShadow = true; body.receiveShadow = true;
    group.add(body);
    for (let i = 0; i < 8; i++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.022, 0.055),
        new THREE.MeshStandardMaterial({ color: 0xe6e8ea, roughness: 0.65, metalness: 0.04 })
      );
      fin.position.set(0, 0.248, -0.22 + i * 0.095);
      group.add(fin);
    }
    const label = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.01),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.85 }));
    label.position.set(-0.02, 0.22, 0.1); group.add(label);
    const ipBadge = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.062, 0.01),
      new THREE.MeshBasicMaterial({ color: 0x1d4ed8 }));
    ipBadge.position.set(0.165, 0.22, 0.105); group.add(ipBadge);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.2), darkMat);
    bezel.position.z = 0.81; bezel.castShadow = true; group.add(bezel);
    const recess = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.36, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x07080a, roughness: 0.95 }));
    recess.position.z = 0.925; group.add(recess);
    const outerRing = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.135, 0.075, 20), lensRingMat);
    (outerRing.geometry as THREE.BufferGeometry).rotateX(Math.PI / 2);
    outerRing.position.z = 0.96; group.add(outerRing);
    const innerBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.098, 0.095, 18), lensRingMat);
    (innerBarrel.geometry as THREE.BufferGeometry).rotateX(Math.PI / 2);
    innerBarrel.position.z = 1.02; group.add(innerBarrel);
    const lensGlass = new THREE.Mesh(new THREE.CircleGeometry(0.078, 22), glassMat);
    lensGlass.position.z = 1.075; group.add(lensGlass);
    const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.45 }));
    highlight.position.set(-0.028, 0.028, 1.085); group.add(highlight);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const irLed = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x4a0e0e }));
      irLed.position.set(Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0.935);
      group.add(irLed);
    }
    const sled = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.026, 0.01),
      new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    sled.position.set(0.185, -0.155, 0.94); group.add(sled);
    group.position.y = 0.55;
  }
  return { mesh: group, leds: [] };
}

function createProceduralRack(units: number, rackType: "closed" | "open" = "closed") {
  const group = new THREE.Group();

  // 1U = 44.45mm real world. We use 0.22m = 1U for good visual scale.
  const slotHeight = 0.22;
  const rackHeight = units * slotHeight + 0.5;

  if (rackType === "open") {
    // â”€â”€â”€ RACK ABERTO (Open Rack 2 Colunas - Foto 2) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const rackWidth = 5.4;
    const rackDepth = 2.4; // Base feet depth
    const innerWidth = 5.2;

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x08090a, metalness: 0.8, roughness: 0.35 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x0d0e10, metalness: 0.7, roughness: 0.4 });
    const railHoleMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const silverMetalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });

    // 1. Heavy Floor Base Feet (Protruding Base Stabilizers)
    const baseLegGeo = new THREE.BoxGeometry(0.35, 0.22, rackDepth);
    const legL = new THREE.Mesh(baseLegGeo, steelMat);
    legL.position.set(-rackWidth / 2 + 0.3, 0.11, 0);
    legL.castShadow = true; legL.receiveShadow = true;
    const legR = legL.clone(); legR.position.x = rackWidth / 2 - 0.3;
    group.add(legL, legR);

    // Floor Base Feet Cross Beam (Connecting floor legs)
    const baseCrossBeam = new THREE.Mesh(new THREE.BoxGeometry(rackWidth - 0.6, 0.18, 0.35), steelMat);
    baseCrossBeam.position.set(0, 0.09, 0);
    baseCrossBeam.receiveShadow = true;
    group.add(baseCrossBeam);

    // Floor mounting pads
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([xs, zs]) => {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), steelMat);
      pad.position.set(xs * (rackWidth / 2 - 0.3), 0.02, zs * (rackDepth / 2 - 0.2));
      group.add(pad);
    });

    // Angled support gussets / brackets tapering from leg to vertical post
    [-1, 1].forEach((xs) => {
      const gX = xs * (rackWidth / 2 - 0.3);
      [-1, 1].forEach((zs) => {
        const gusset = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.6), steelMat);
        gusset.position.set(gX, 0.4, zs * 0.35);
        gusset.rotation.x = -zs * (Math.PI / 6);
        group.add(gusset);
      });
    });

    // 2. Vertical C-Channel Posts (Left and Right)
    const postGeo = new THREE.BoxGeometry(0.32, rackHeight - 0.3, 0.35);
    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-innerWidth / 2 + 0.16, rackHeight / 2 + 0.1, 0);
    postL.castShadow = true; postL.receiveShadow = true;
    const postR = postL.clone(); postR.position.x = innerWidth / 2 - 0.16;
    group.add(postL, postR);

    // Front & side 19" U mounting hole patterns
    const holeStripW = 0.08;
    const holeStripH = rackHeight - 0.6;
    const holeStripGeo = new THREE.BoxGeometry(holeStripW, holeStripH, 0.01);
    const stripMat = new THREE.MeshStandardMaterial({ color: 0x2d3137, metalness: 0.7, roughness: 0.3 });

    [-1, 1].forEach((xs) => {
      const pX = xs * (innerWidth / 2 - 0.16);
      const stripF = new THREE.Mesh(holeStripGeo, stripMat);
      stripF.position.set(pX, rackHeight / 2 + 0.1, 0.176);
      group.add(stripF);

      const numHoleRows = Math.floor(units * 3);
      for (let i = 0; i < numHoleRows; i++) {
        const hY = (rackHeight / 2 + 0.1) - holeStripH / 2 + (i + 0.5) * (holeStripH / numHoleRows);
        const hole = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.015), railHoleMat);
        hole.position.set(pX, hY, 0.178);
        group.add(hole);
      }
    });

    // 3. Top Header Span (Header Panel - Photo 2 Top Bar)
    const headerHeight = 0.6;
    const headerBar = new THREE.Mesh(new THREE.BoxGeometry(rackWidth - 0.1, headerHeight, 0.4), steelMat);
    headerBar.position.set(0, rackHeight - headerHeight / 2, 0);
    headerBar.castShadow = true;
    group.add(headerBar);

    // Top Header Front Recessed Panel (Brand area like Intelbras style in photo 2)
    const headerRecess = new THREE.Mesh(
      new THREE.BoxGeometry(rackWidth - 0.6, headerHeight - 0.16, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.6 })
    );
    headerRecess.position.set(0, rackHeight - headerHeight / 2, 0.205);
    group.add(headerRecess);

    // Brand accent plate on top header bar
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.08, 0.01),
      silverMetalMat
    );
    badge.position.set(0, rackHeight - headerHeight / 2, 0.218);
    group.add(badge);

    // Cable pass-through openings at top of header
    [-1, 1].forEach((xs) => {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.42, 16), railHoleMat);
      hole.position.set(xs * (rackWidth / 2 - 0.6), rackHeight - headerHeight / 2, 0);
      group.add(hole);
    });

    // Blue decorative vertical accent LED strip inside column inner edge
    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, rackHeight - 0.8, 0.03),
      new THREE.MeshBasicMaterial({ color: 0x0ea5e9 })
    );
    ledStrip.position.set(-innerWidth / 2 + 0.35, rackHeight / 2, 0);
    group.add(ledStrip);

    // innerWidth = 5.2, rackDepth = 2.4, front rail Z = 0 (open rack has no door)
    return { mesh: group, doorPivot: null, slotHeight, startY: 0.25, rackHeight, rackType: "open", innerWidth: 5.2, innerDepth: 2.4, frontRailZ: 0.0 };
  }

  // â”€â”€â”€ RACK FECHADO (Gabinete de Servidor com Porta de Vidro - Foto 1) â”€â”€â”€â”€â”€â”€â”€â”€
  const rackWidth = 5.4;
  const rackDepth = 4.0;

  // Outer cabinet materials matching Photo 1
  const outerCabinetMat = new THREE.MeshStandardMaterial({ color: 0x060708, metalness: 0.85, roughness: 0.35 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0a0b0c, metalness: 0.8, roughness: 0.4 });
  const innerRailMat = new THREE.MeshStandardMaterial({ color: 0xa0a8b2, metalness: 0.8, roughness: 0.25 });
  const ventSlotMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const lockSilverMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.15 });

  // Base and Top Caps
  const base = new THREE.Mesh(new THREE.BoxGeometry(rackWidth, 0.25, rackDepth), outerCabinetMat);
  base.position.y = 0.125;
  base.receiveShadow = true; base.castShadow = true;
  group.add(base);

  const topLid = base.clone();
  topLid.position.y = rackHeight - 0.125;
  group.add(topLid);

  // Corner Bracket Block Caps (Photo 1 top & bottom corner details with hex socket caps)
  const capGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([xs, zs]) => {
    const capTop = new THREE.Mesh(capGeo, outerCabinetMat);
    capTop.position.set(xs * (rackWidth / 2 - 0.15), rackHeight - 0.16, zs * (rackDepth / 2 - 0.15));
    const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 6), lockSilverMat);
    hex.position.set(xs * (rackWidth / 2 - 0.15), rackHeight - 0.01, zs * (rackDepth / 2 - 0.15));
    group.add(capTop, hex);

    const capBtm = new THREE.Mesh(capGeo, outerCabinetMat);
    capBtm.position.set(xs * (rackWidth / 2 - 0.15), 0.16, zs * (rackDepth / 2 - 0.15));
    group.add(capBtm);
  });

  // Outer Corner Pillars
  const pillarGeo = new THREE.BoxGeometry(0.24, rackHeight - 0.5, 0.24);
  const p1 = new THREE.Mesh(pillarGeo, outerCabinetMat);
  p1.position.set(-rackWidth / 2 + 0.12, rackHeight / 2, -rackDepth / 2 + 0.12);
  const p2 = p1.clone(); p2.position.x = rackWidth / 2 - 0.12;
  const p3 = p1.clone(); p3.position.z = rackDepth / 2 - 0.12;
  const p4 = p2.clone(); p4.position.z = rackDepth / 2 - 0.12;
  p1.castShadow = true; p2.castShadow = true; p3.castShadow = true; p4.castShadow = true;
  group.add(p1, p2, p3, p4);

  // Side Panels (Matching Photo 1: Upper section and Lower section with ventilation slot grids!)
  const sideW = 0.04;
  const sideH = (rackHeight - 0.5) / 2 - 0.02;
  const sideD = rackDepth - 0.44;

  [-1, 1].forEach((sideX) => {
    const px = sideX * (rackWidth / 2 - 0.02);

    const topPanel = new THREE.Mesh(new THREE.BoxGeometry(sideW, sideH, sideD), frameMat);
    topPanel.position.set(px, rackHeight * 0.72, 0);
    topPanel.castShadow = true;
    group.add(topPanel);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(sideW + 0.01, 0.025, 0.08), ventSlotMat);
        slot.position.set(px, rackHeight * 0.76 - r * 0.05, -0.3 + c * 0.14);
        group.add(slot);
      }
    }

    const sideLock = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, sideW + 0.02, 12), lockSilverMat);
    sideLock.rotation.z = Math.PI / 2;
    sideLock.position.set(px, rackHeight * 0.88, 0.6);
    group.add(sideLock);

    const btmPanel = new THREE.Mesh(new THREE.BoxGeometry(sideW, sideH, sideD), frameMat);
    btmPanel.position.set(px, rackHeight * 0.28, 0);
    btmPanel.castShadow = true;
    group.add(btmPanel);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(sideW + 0.01, 0.025, 0.08), ventSlotMat);
        slot.position.set(px, rackHeight * 0.22 + r * 0.05, -0.3 + c * 0.14);
        group.add(slot);
      }
    }

    const seam = new THREE.Mesh(new THREE.BoxGeometry(sideW + 0.01, 0.03, sideD), ventSlotMat);
    seam.position.set(px, rackHeight / 2, 0);
    group.add(seam);
  });

  // Back Panel (with ventilation grid)
  const backGeo = new THREE.BoxGeometry(rackWidth - 0.44, rackHeight - 0.5, 0.04);
  const backPanel = new THREE.Mesh(backGeo, frameMat);
  backPanel.position.set(0, rackHeight / 2, -rackDepth / 2 + 0.02);
  group.add(backPanel);

  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      const slotTop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.05), ventSlotMat);
      slotTop.position.set(-1.4 + c * 0.4, rackHeight * 0.8 - r * 0.06, -rackDepth / 2 + 0.02);
      const slotBtm = slotTop.clone();
      slotBtm.position.y = rackHeight * 0.25 - r * 0.06;
      group.add(slotTop, slotBtm);
    }
  }

  // Inner 19" Mounting Rails (Vertical)
  const railGeo = new THREE.BoxGeometry(0.08, rackHeight - 0.5, 0.08);
  const innerWidth = 5.2;
  const railFL = new THREE.Mesh(railGeo, innerRailMat);
  railFL.position.set(-innerWidth / 2 + 0.16, rackHeight / 2, rackDepth / 2 - 0.25);
  const railFR = railFL.clone(); railFR.position.x = innerWidth / 2 - 0.16;
  const railBL = railFL.clone(); railBL.position.z = -rackDepth / 2 + 0.25;
  const railBR = railBL.clone(); railBR.position.z = -rackDepth / 2 + 0.25;
  group.add(railFL, railFR, railBL, railBR);

  // Front Glass Door with Hinge Pivot
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-rackWidth / 2, rackHeight / 2, rackDepth / 2);

  const doorWidth = rackWidth;
  const doorHeight = rackHeight - 0.5;
  const doorThickness = 0.08;

  const frameWidth = 0.35;
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness), frameMat);
  doorFrame.position.set(doorWidth / 2, 0, doorThickness / 2);
  doorPivot.add(doorFrame);

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0a0c0f,
    transparent: true,
    opacity: 0.68,
    metalness: 0.85,
    roughness: 0.08,
  });
  const glassWidth = doorWidth - (frameWidth * 2);
  const glassHeight = doorHeight - (frameWidth * 2);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(glassWidth, glassHeight, doorThickness + 0.005), glassMat);
  glass.position.set(doorWidth / 2, 0, doorThickness / 2);
  doorPivot.add(glass);

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const ventT = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, doorThickness + 0.01), ventSlotMat);
      ventT.position.set(doorWidth / 2 - 0.25 + c * 0.25, glassHeight * 0.35 - r * 0.06, doorThickness / 2);
      const ventB = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, doorThickness + 0.01), ventSlotMat);
      ventB.position.set(doorWidth / 2 - 0.25 + c * 0.25, -glassHeight * 0.35 + r * 0.06, doorThickness / 2);
      doorPivot.add(ventT, ventB);
    }
  }

  const lockBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16), lockSilverMat);
  lockBase.rotation.x = Math.PI / 2;
  lockBase.position.set(doorWidth - frameWidth / 2, 0, doorThickness + 0.04);
  doorPivot.add(lockBase);

  const lockKeyhole = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.02), ventSlotMat);
  lockKeyhole.position.set(doorWidth - frameWidth / 2, 0, doorThickness + 0.1);
  doorPivot.add(lockKeyhole);

  const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16), lockSilverMat);
  keyRing.position.set(doorWidth - frameWidth / 2, -0.06, doorThickness + 0.11);
  doorPivot.add(keyRing);

  group.add(doorPivot);

  const ledStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, rackHeight - 0.6, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x0ea5e9 })
  );
  ledStrip.position.set(-innerWidth / 2 + 0.2, rackHeight / 2, rackDepth / 2 - 0.3);
  group.add(ledStrip);

  // innerWidth = 5.2, rackDepth = 4.0, front rails at rackDepth/2 - 0.25 = 1.75
  return { mesh: group, doorPivot, slotHeight, startY: 0.25, rackHeight, rackType: "closed", innerWidth: 5.2, innerDepth: 4.0, frontRailZ: 1.75 };
}
function createProceduralOLT(ponPorts: number, uplinkPorts: number) {
  const group = new THREE.Group();
  const width = 5.0;
  const depth = 3.0;
  const height = 0.95;

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.2, roughness: 0.22 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const faceMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.2, roughness: 0.12 });
  const face = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, height + 0.04, 0.09), faceMat);
  face.position.set(0, 0, depth / 2 + 0.045);
  group.add(face);

  const earMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.2, roughness: 0.3 });
  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.18, height, 0.34), earMat);
  earL.position.set(-width / 2 - 0.09, 0, depth / 2 - 0.17);
  const earR = earL.clone(); earR.position.x = width / 2 + 0.09;
  group.add(earL, earR);

  const panelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.25, roughness: 0.8 });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, height * 0.56, 0.02), panelMat);
  panel.position.set(-0.55, 0.05, depth / 2 + 0.06);
  group.add(panel);

  const ponBorderMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.2, metalness: 0.2 });
  const ponGeo = new THREE.BoxGeometry(0.1, 0.12, 0.02);
  const ponMat = new THREE.MeshBasicMaterial({ color: 0x052e16 });
  const startX = -1.75;
  const leds: THREE.Mesh[] = [];
  const ledGeo = new THREE.BoxGeometry(0.026, 0.026, 0.008);
  const activeLed = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
  for (let i = 0; i < ponPorts; i++) {
    const px = startX + i * 0.18;
    const border = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.01), ponBorderMat);
    border.position.set(px, 0.1, depth / 2 + 0.05);
    group.add(border);
    const port = new THREE.Mesh(ponGeo, ponMat);
    port.position.set(px, 0.1, depth / 2 + 0.06);
    group.add(port);
    const led = new THREE.Mesh(ledGeo, activeLed);
    led.position.set(px, 0.23, depth / 2 + 0.06);
    group.add(led);
    leds.push(led);
  }

  const uplinkBorderMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.2, roughness: 0.1 });
  const upGeo = new THREE.BoxGeometry(0.12, 0.12, 0.02);
  const upMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const upStartX = 1.15;
  for (let i = 0; i < uplinkPorts; i++) {
    const px = upStartX + i * 0.24;
    const border = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.01), uplinkBorderMat);
    border.position.set(px, 0.1, depth / 2 + 0.05);
    group.add(border);
    const port = new THREE.Mesh(upGeo, upMat);
    port.position.set(px, 0.1, depth / 2 + 0.06);
    group.add(port);
  }

  const vent = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.01), new THREE.MeshBasicMaterial({ color: 0x020617 }));
  vent.position.set(-1.0, -0.16, depth / 2 + 0.06);
  group.add(vent);

  const label = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 0.01), new THREE.MeshBasicMaterial({ color: 0x1d4ed8 }));
  label.position.set(1.25, 0.22, depth / 2 + 0.06);
  group.add(label);

  return { mesh: group, leds };
}

function createProceduralDIO(ports: number, type: string) {
  const group = new THREE.Group();
  const width = 4.9;
  const depth = 2.2;
  const rows = ports <= 24 ? 1 : ports <= 48 ? 2 : 3;
  const height = rows === 1 ? 0.45 : rows === 2 ? 0.9 : 1.35;

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xbcc4ce, metalness: 0.2, roughness: 0.32 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const faceMat = new THREE.MeshStandardMaterial({ color: 0xcfd7e0, metalness: 0.2, roughness: 0.28 });
  const face = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, height + 0.02, 0.035), faceMat);
  face.position.set(0, 0, depth / 2 + 0.017);
  group.add(face);

  const earMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.2, roughness: 0.5 });
  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.16, height, 0.32), earMat);
  earL.position.set(-width / 2 - 0.08, 0, depth / 2 - 0.16);
  const earR = earL.clone(); earR.position.x = width / 2 + 0.08;
  group.add(earL, earR);

  const isAPC = type === "SC/APC";
  const isLC = type === "LC";
  const adapterColor = isAPC ? 0x16a34a : isLC ? 0x60a5fa : 0x3b82f6;
  const adapterMat = new THREE.MeshStandardMaterial({ color: adapterColor, roughness: 0.25, metalness: 0.1 });
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const adapterW = ports > 48 ? 0.06 : 0.08;
  const adapterH = ports > 48 ? 0.07 : 0.1;
  const adapterGeo = new THREE.BoxGeometry(adapterW, adapterH, 0.025);
  const holeGeo = new THREE.BoxGeometry(adapterW * 0.5, adapterH * 0.45, 0.01);
  const portsPerRow = Math.ceil(ports / rows);
  const spacing = Math.min(0.16, (width - 0.5) / portsPerRow);
  const startX = -((portsPerRow - 1) * spacing) / 2;
  const rowYOffset = height / (rows + 1);

  for (let r = 0; r < rows; r++) {
    const py = height / 2 - rowYOffset * (r + 1);
    const portsInThisRow = Math.min(portsPerRow, ports - r * portsPerRow);
    const rowStartX = -((portsInThisRow - 1) * spacing) / 2;
    for (let c = 0; c < portsInThisRow; c++) {
      const px = rowStartX + c * spacing;
      const adapter = new THREE.Mesh(adapterGeo, adapterMat);
      adapter.position.set(px, py, depth / 2 + 0.024);
      group.add(adapter);
      const hole = new THREE.Mesh(holeGeo, holeMat);
      hole.position.set(px, py, depth / 2 + 0.034);
      group.add(hole);
    }
  }

  const labelMat = new THREE.MeshBasicMaterial({ color: isAPC ? 0x14532d : 0x1e3a8a });
  const label = new THREE.Mesh(new THREE.BoxGeometry(width * 0.55, 0.06, 0.01), labelMat);
  label.position.set(-width * 0.2, height / 2 - 0.04, depth / 2 + 0.02);
  group.add(label);

  const routingGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8);
  (routingGeo as THREE.CylinderGeometry).rotateX(Math.PI / 2);
  const rEarL = new THREE.Mesh(routingGeo, earMat);
  rEarL.position.set(-2.2, 0, depth / 2 + 0.12);
  const rEarR = rEarL.clone(); rEarR.position.x = 2.2;
  group.add(rEarL, rEarR);

  return { mesh: group, leds: [] };
}


function createProceduralRouter(interfaces: number) {
  const group = new THREE.Group();
  const width = 4.8;
  const depth = 3.0;
  const height = 0.9;

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.2, roughness: 0.12 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const face = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, height + 0.02, 0.06), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.2, roughness: 0.12 }));
  face.position.set(0, 0, depth / 2 + 0.03);
  group.add(face);

  const earMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.2, roughness: 0.3 });
  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.16, height, 0.32), earMat);
  earL.position.set(-width / 2 - 0.08, 0, depth / 2 - 0.16);
  const earR = earL.clone(); earR.position.x = width / 2 + 0.08;
  group.add(earL, earR);

  const lcd = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.56, 0.02), new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }));
  lcd.position.set(-1.3, 0.08, depth / 2 + 0.04);
  group.add(lcd);

  const displayText = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.008), new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
  displayText.position.set(-1.3, 0.14, depth / 2 + 0.05);
  group.add(displayText);

  const panel = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.32, 0.02), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.1 }));
  panel.position.set(0.55, -0.1, depth / 2 + 0.06);
  group.add(panel);

  const portGeo = new THREE.BoxGeometry(0.12, 0.12, 0.02);
  const portMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const borderMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.2, metalness: 0.2 });
  const borderGeo = new THREE.BoxGeometry(0.16, 0.16, 0.01);
  const leds: THREE.Mesh[] = [];
  const ledGeo = new THREE.BoxGeometry(0.025, 0.025, 0.01);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

  const rows = interfaces > 24 ? 2 : 1;
  const cols = Math.min(interfaces, 24);
  const startX = -((cols - 1) * 0.2) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r * 24 + c >= interfaces) break;
      const px = startX + c * 0.2;
      const py = rows > 1 ? (r === 0 ? 0.16 : -0.16) : 0;
      const border = new THREE.Mesh(borderGeo, borderMat);
      border.position.set(px, py, depth / 2 + 0.035);
      group.add(border);
      const port = new THREE.Mesh(portGeo, portMat);
      port.position.set(px, py, depth / 2 + 0.045);
      group.add(port);
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(px, py + 0.12, depth / 2 + 0.045);
      group.add(led);
      leds.push(led);
    }
  }

  const powerLed = new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), new THREE.MeshBasicMaterial({ color: 0x34d399 }));
  powerLed.position.set(-1.8, -0.22, depth / 2 + 0.05);
  group.add(powerLed);

  return { mesh: group, leds };
}
function createProceduralDwdm() {
  const group = new THREE.Group();

  // Dimensions
  const width = 5.8;
  const depth = 2.6;
  const height = 3.6; // ~14U chassis
  const faceZ = depth / 2;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a3a7a, metalness: 0.35, roughness: 0.45 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.4, roughness: 0.2 });
  const cardSilver = new THREE.MeshStandardMaterial({ color: 0xd4d8e1, metalness: 0.55, roughness: 0.25 });
  const cardWhite = new THREE.MeshStandardMaterial({ color: 0xe8eaf0, metalness: 0.3, roughness: 0.3 });
  const leverMat = new THREE.MeshStandardMaterial({ color: 0x8a9ab5, metalness: 0.7, roughness: 0.18 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, metalness: 0.15, roughness: 0.55 });
  const darkBlueMat = new THREE.MeshStandardMaterial({ color: 0x0f2255, metalness: 0.3, roughness: 0.5 });
  const connBlue = new THREE.MeshStandardMaterial({ color: 0x2a7fff, metalness: 0.1, roughness: 0.3 });
  const connAqua = new THREE.MeshStandardMaterial({ color: 0x00c6cc, metalness: 0.1, roughness: 0.3 });
  const earMat = new THREE.MeshStandardMaterial({ color: 0x1a3a7a, metalness: 0.4, roughness: 0.4 });
  const yellowWarn = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.1, roughness: 0.6 });
  const leds: THREE.Mesh[] = [];

  // Main chassis body
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Top branding panel
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(width * 0.78, 0.32, 0.06), accentMat);
  topBar.position.set(-width * 0.07, height / 2 - 0.16, faceZ + 0.03);
  group.add(topBar);

  // System indicator LEDs on top panel
  const indicatorColors = [0x22c55e, 0xff4444, 0xf59e0b, 0x888888, 0x22c55e, 0x888888];
  indicatorColors.forEach((col, i) => {
    const ind = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
    ind.position.set(-0.6 + i * 0.13, height / 2 - 0.18, faceZ + 0.065);
    leds.push(ind);
    group.add(ind);
  });

  // HUAWEI logo plate
  const logoPlate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.01), cardWhite);
  logoPlate.position.set(width / 2 - 0.58, height / 2 - 0.18, faceZ + 0.04);
  group.add(logoPlate);

  // OptiX label
  const optixPlate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.01), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: 1 }));
  optixPlate.position.set(-width / 2 + 0.44, height / 2 - 0.18, faceZ + 0.04);
  group.add(optixPlate);

  // Bottom cable management tray
  const cableTray = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 0.55, 0.12), darkBlueMat);
  cableTray.position.set(0, -height / 2 + 0.275, faceZ + 0.04);
  group.add(cableTray);

  // Numbered slot guides on cable tray
  const guideW = (width * 0.9) / 17;
  for (let g = 0; g < 17; g++) {
    const gx = -width * 0.45 + (g + 0.5) * guideW;
    const guide = new THREE.Mesh(new THREE.BoxGeometry(guideW * 0.7, 0.35, 0.06), accentMat);
    guide.position.set(gx, -height / 2 + 0.18, faceZ + 0.09);
    group.add(guide);
  }

  // Fan tray (rear bottom)
  const fanTray = new THREE.Mesh(new THREE.BoxGeometry(width * 0.6, 0.55, 0.18), blackMat);
  fanTray.position.set(0, -height / 2 + 0.275, -faceZ + 0.09);
  group.add(fanTray);

  // Card slot region
  const numSlots = 17;
  const slotAreaW = width * 0.91;
  const slotAreaH = height - 0.32 - 0.55;
  const slotAreaY = (0.32 - 0.55) / 2;
  const slotW = slotAreaW / numSlots;

  const slotTypes: string[] = [
    "scc", "scc", "blank", "blank", "blank", "lsx", "m40v", "m40v",
    "blank", "m40v", "m40v", "oau", "oau", "oau", "oau", "blank", "piu"
  ];

  for (let i = 0; i < numSlots; i++) {
    const cx = -slotAreaW / 2 + (i + 0.5) * slotW;
    const type = slotTypes[i] ?? "blank";
    const cMat = (type === "piu") ? darkBlueMat : (type === "scc") ? cardWhite : cardSilver;

    const card = new THREE.Mesh(new THREE.BoxGeometry(slotW * 0.91, slotAreaH - 0.06, 0.05), cMat);
    card.position.set(cx, slotAreaY, faceZ + 0.025);
    group.add(card);

    const topLever = new THREE.Mesh(new THREE.BoxGeometry(slotW * 0.7, 0.18, 0.1), leverMat);
    topLever.position.set(cx, slotAreaY + slotAreaH / 2 - 0.12, faceZ + 0.06);
    group.add(topLever);

    const botLever = new THREE.Mesh(new THREE.BoxGeometry(slotW * 0.7, 0.18, 0.1), leverMat);
    botLever.position.set(cx, slotAreaY - slotAreaH / 2 + 0.12, faceZ + 0.06);
    group.add(botLever);

    if (type === "m40v" || type === "oau") {
      const connMat = type === "oau" ? connAqua : connBlue;
      const numConn = type === "oau" ? 6 : 10;
      const connH = 0.115;
      const startY = slotAreaY + (numConn / 2 - 0.5) * connH * 1.05;
      for (let c = 0; c < numConn; c++) {
        const cy = startY - c * connH * 1.05;
        const conn = new THREE.Mesh(new THREE.BoxGeometry(slotW * 0.78, connH * 0.88, 0.1), connMat);
        conn.position.set(cx, cy, faceZ + 0.06);
        group.add(conn);
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.01), new THREE.MeshBasicMaterial({ color: type === "oau" ? 0x00ffcc : 0x3b82f6 }));
        led.position.set(cx + slotW * 0.3, cy + connH * 0.3, faceZ + 0.12);
        leds.push(led);
        group.add(led);
      }
    } else if (type === "scc") {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
      btn.rotation.x = Math.PI / 2;
      btn.position.set(cx, slotAreaY + 0.3, faceZ + 0.06);
      group.add(btn);
      [0x22c55e, 0x22c55e, 0xf59e0b].forEach((col, li) => {
        const sled = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
        sled.position.set(cx, slotAreaY + 0.1 - li * 0.12, faceZ + 0.065);
        leds.push(sled);
        group.add(sled);
      });
    } else if (type === "lsx") {
      for (let sfp = 0; sfp < 4; sfp++) {
        const cage = new THREE.Mesh(new THREE.BoxGeometry(slotW * 0.8, 0.14, 0.08), blackMat);
        cage.position.set(cx, slotAreaY + 0.2 - sfp * 0.2, faceZ + 0.06);
        group.add(cage);
      }
    } else if (type === "piu") {
      const termBlock = new THREE.Mesh(new THREE.BoxGeometry(slotW * 0.75, 0.9, 0.12), blackMat);
      termBlock.position.set(cx, slotAreaY, faceZ + 0.06);
      group.add(termBlock);
      const redBar = new THREE.Mesh(new THREE.BoxGeometry(slotW * 0.5, 0.08, 0.06), new THREE.MeshStandardMaterial({ color: 0xcc1111 }));
      redBar.position.set(cx, slotAreaY + 0.25, faceZ + 0.11);
      group.add(redBar);
      const blueBar = new THREE.Mesh(new THREE.BoxGeometry(slotW * 0.5, 0.08, 0.06), new THREE.MeshStandardMaterial({ color: 0x1155cc }));
      blueBar.position.set(cx, slotAreaY - 0.05, faceZ + 0.11);
      group.add(blueBar);
    }

    if (type === "oau") {
      const warn = new THREE.Mesh(new THREE.BoxGeometry(slotW * 0.6, 0.22, 0.01), yellowWarn);
      warn.position.set(cx, slotAreaY + 0.5, faceZ + 0.055);
      group.add(warn);
    }
  }

  // Rack ears with cable guide loops
  const earH = height * 0.88;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.55, earH, 0.28), earMat);
    ear.position.set(side * (width / 2 + 0.275), 0, faceZ - 0.14);
    group.add(ear);

    const flange = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.06), accentMat);
    flange.position.set(side * (width / 2 + 0.275), earH / 2 - 0.09, faceZ + 0.04);
    group.add(flange);
    const flangeBot = flange.clone();
    flangeBot.position.set(side * (width / 2 + 0.275), -earH / 2 + 0.09, faceZ + 0.04);
    group.add(flangeBot);

    for (let g = 0; g < 3; g++) {
      const gy = earH / 2 - 0.4 - g * (earH * 0.25);
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 8, 16, Math.PI), earMat);
      arc.rotation.z = side === -1 ? Math.PI / 2 : -Math.PI / 2;
      arc.position.set(side * (width / 2 + 0.275), gy, faceZ + 0.02);
      group.add(arc);
    }
  }

  // Rear panel
  const rearPanel = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.1), darkBlueMat);
  rearPanel.position.set(0, 0, -faceZ + 0.05);
  group.add(rearPanel);

  return { mesh: group, leds };
}

function createProceduralServer(diskCount: number) {
  const group = new THREE.Group();
  const width = 4.9;
  const depth = 3.4;
  const height = 0.9;

  // Main chassis - dark metallic
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0b0c, metalness: 0.6, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Front bezel (black metallic)
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0x050506, metalness: 0.7, roughness: 0.3 });
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, height - 0.02, 0.08), bezelMat);
  bezel.position.set(0, 0, depth / 2 + 0.04);
  group.add(bezel);

  // Rack ears
  const earMat = new THREE.MeshStandardMaterial({ color: 0x050506, metalness: 0.8, roughness: 0.2 });
  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.16, height, 0.2), earMat);
  earL.position.set(-width / 2 - 0.08, 0, depth / 2 - 0.1);
  const earR = earL.clone(); earR.position.x = width / 2 + 0.08;
  group.add(earL, earR);

  // Rack ear holes
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  for (let i = 0; i < 2; i++) {
    const holeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.25), holeMat);
    holeL.position.set(-width / 2 - 0.08, 0.25 - i * 0.5, depth / 2 - 0.1);
    const holeR = holeL.clone(); holeR.position.x = width / 2 + 0.08;
    group.add(holeL, holeR);
  }

  // Handle extrusions on ears
  const handleL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.15), bezelMat);
  handleL.position.set(-width / 2 - 0.03, 0, depth / 2 + 0.1);
  const handleR = handleL.clone(); handleR.position.x = width / 2 + 0.03;
  group.add(handleL, handleR);

  const leds: THREE.Mesh[] = [];

  // Left Section: 8 vertical drive bays
  const driveW = 0.22;
  const driveH = height - 0.15;
  const driveGeo = new THREE.BoxGeometry(driveW, driveH, 0.04);
  const driveMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, metalness: 0.5, roughness: 0.6 });
  const driveHandleGeo = new THREE.BoxGeometry(0.04, driveH - 0.1, 0.03);
  const driveHandleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
  const ledGeo = new THREE.BoxGeometry(0.02, 0.02, 0.01);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

  const startX = -width / 2 + 0.3;
  for (let i = 0; i < 8; i++) {
    const px = startX + i * 0.26;
    const drive = new THREE.Mesh(driveGeo, driveMat);
    drive.position.set(px, 0, depth / 2 + 0.08);
    group.add(drive);

    // Vertical Handle
    const handle = new THREE.Mesh(driveHandleGeo, driveHandleMat);
    handle.position.set(px - 0.06, 0, depth / 2 + 0.1);
    group.add(handle);

    // Status LED
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(px + 0.05, -driveH / 2 + 0.06, depth / 2 + 0.1);
    group.add(led);
    leds.push(led);
  }

  // Center Section
  // CD/DVD tray (top center)
  const cdW = 0.8;
  const cdH = 0.12;
  const cdTray = new THREE.Mesh(new THREE.BoxGeometry(cdW, cdH, 0.02), new THREE.MeshStandardMaterial({ color: 0x000000 }));
  cdTray.position.set(0.2, 0.25, depth / 2 + 0.08);
  group.add(cdTray);
  const cdBtn = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  cdBtn.position.set(0.2 + cdW / 2 + 0.05, 0.25, depth / 2 + 0.08);
  group.add(cdBtn);

  // Port Cluster (bottom center)
  const portGroupX = 0.2;
  const portGroupY = -0.15;
  // VGA port
  const vga = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.02), new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
  vga.position.set(portGroupX - 0.4, portGroupY, depth / 2 + 0.08);
  group.add(vga);
  // USB ports
  for (let i = 0; i < 2; i++) {
    const usb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.02), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    usb.position.set(portGroupX - 0.15, portGroupY + 0.05 - i * 0.1, depth / 2 + 0.08);
    group.add(usb);
  }
  // RJ45 Ports (2x4)
  const rjMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const rjBorder = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const px = portGroupX + 0.1 + col * 0.16;
      const py = portGroupY + 0.08 - row * 0.16;
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.01), rjBorder);
      b.position.set(px, py, depth / 2 + 0.08);
      group.add(b);
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02), rjMat);
      p.position.set(px, py, depth / 2 + 0.085);
      group.add(p);
    }
  }

  // Right Section: Cooling Grill & Buttons
  // Grill
  const grillW = 1.3;
  const grillH = height - 0.2;
  const grill = new THREE.Mesh(new THREE.BoxGeometry(grillW, grillH, 0.02), new THREE.MeshStandardMaterial({ color: 0x050505 }));
  grill.position.set(width / 2 - 0.85, 0, depth / 2 + 0.08);
  group.add(grill);

  // Grill hex/holes pattern (represented by vertical bars for simplicity)
  for (let i = 0; i < 12; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, grillH, 0.02), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    bar.position.set(width / 2 - 1.4 + i * 0.1, 0, depth / 2 + 0.085);
    group.add(bar);
  }

  // Info panel / Buttons (rightmost)
  const infoPan = new THREE.Mesh(new THREE.BoxGeometry(0.3, grillH, 0.02), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  infoPan.position.set(width / 2 - 0.15, 0, depth / 2 + 0.08);
  group.add(infoPan);

  // Power Button
  const powerBtn = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
  powerBtn.position.set(width / 2 - 0.15, 0.2, depth / 2 + 0.091);
  group.add(powerBtn);
  // Power LED ring
  const powerLed = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.01, 8, 16), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  powerLed.position.set(width / 2 - 0.15, 0.2, depth / 2 + 0.091);
  group.add(powerLed);
  leds.push(powerLed);

  // Status LEDs (Warning/Fault/ID)
  const ledColors = [0x3b82f6, 0xf59e0b, 0xef4444];
  for (let i = 0; i < 3; i++) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.01), new THREE.MeshBasicMaterial({ color: ledColors[i] }));
    l.position.set(width / 2 - 0.15, 0.0 - i * 0.1, depth / 2 + 0.091);
    group.add(l);
    leds.push(l);
  }

  return { mesh: group, leds };
}

function createProceduralStationaryBattery(capacity: number, isLithium = false, voltage?: number) {
  const group = new THREE.Group();

  if (isLithium) {
    // Rack-mountable Lithium Battery (like Huawei ESM)
    const width = 4.8;  // 19 inches rack width
    const depth = 3.0;
    const height = 1.35; // 3U height

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1f2124, roughness: 0.8, metalness: 0.2 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Front face panel details
    const panelZ = depth / 2 + 0.01;

    // Rack ears
    const earGeo = new THREE.BoxGeometry(0.12, height, 0.1);
    const earMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-width / 2 + 0.06, height / 2, panelZ - 0.05);
    const rightEar = leftEar.clone();
    rightEar.position.x = width / 2 - 0.06;
    group.add(leftEar, rightEar);

    // Handles
    const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 });
    const leftHandle = new THREE.Mesh(handleGeo, handleMat);
    leftHandle.position.set(-width / 2 + 0.25, height / 2, panelZ + 0.1);
    const rightHandle = leftHandle.clone();
    rightHandle.position.x = width / 2 - 0.25;
    group.add(leftHandle, rightHandle);

    // LEDs (RUN, ALM, CHG, DCHG)
    const ledZ = panelZ + 0.005;
    const ledMatOn = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const ledMatOff = new THREE.MeshBasicMaterial({ color: 0x111111 });
    for (let i = 0; i < 4; i++) {
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.01), i === 0 || i === 2 ? ledMatOn : ledMatOff);
      led.position.set(-width / 2 + 1.0, height * 0.7 - (i * 0.15), ledZ);
      group.add(led);
    }

    // Red Power/Manual ON/OFF Button
    const btnMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), btnMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(width / 2 - 1.2, height / 2, ledZ + 0.01);
    group.add(btn);

    // Terminals / Circuit Breaker area on the right
    const breakerBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.02), new THREE.MeshStandardMaterial({ color: 0x0a0a0a }));
    breakerBox.position.set(width / 2 - 0.5, height / 2, ledZ);
    group.add(breakerBox);

    // Warning / Tech Specs labels
    const labelMat = new THREE.MeshBasicMaterial({ color: 0xdddddd });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const label1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.01), labelMat);
    label1.position.set(width / 2 - 1.8, height * 0.65, ledZ);
    const label2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.01), yellowMat);
    label2.position.set(width / 2 - 1.8, height * 0.4, ledZ);
    group.add(label1, label2);

    return { mesh: group, leds: [] };
  }

  // Moura style: wide, flat, rectangular (like a truck/UPS battery)
  // Width > depth >> height ratio
  const width = capacity >= 150 ? 3.2 : capacity >= 100 ? 2.8 : capacity >= 75 ? 2.4 : 2.0;
  const depth = capacity >= 100 ? 1.3 : 1.0;
  const height = capacity >= 200 ? 1.4 : capacity >= 100 ? 1.1 : 0.9;

  // Main body - black
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111213, roughness: 0.65, metalness: 0.15 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Mid seam line around body (lid split)
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const seam = new THREE.Mesh(new THREE.BoxGeometry(width + 0.01, 0.03, depth + 0.01), seamMat);
  seam.position.y = height * 0.35;
  group.add(seam);

  // Top cover (slightly raised lip)
  const topMat = new THREE.MeshStandardMaterial({ color: 0x0f0f10, roughness: 0.7, metalness: 0.1 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.06, depth + 0.04), topMat);
  top.position.y = height + 0.03;
  top.castShadow = true;
  group.add(top);

  // Front face label â€” Moura style (blue left band + white right area)
  const labelW = width * 0.8;
  const labelH = height * 0.55;
  const labelZ = depth / 2 + 0.01;

  // White background
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xf0f4f8 });
  const labelBg = new THREE.Mesh(new THREE.BoxGeometry(labelW, labelH, 0.015), whiteMat);
  labelBg.position.set(width * 0.03, height / 2, labelZ);
  group.add(labelBg);

  // Blue left band (Moura M shape approximation)
  const blueMat = new THREE.MeshBasicMaterial({ color: 0x1a4da1 });
  const blueBand = new THREE.Mesh(new THREE.BoxGeometry(labelW * 0.38, labelH, 0.016), blueMat);
  blueBand.position.set(width * 0.03 - labelW * 0.31, height / 2, labelZ);
  group.add(blueBand);

  // Yellow safety stripe on label top
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf5c400 });
  const yellowStripe = new THREE.Mesh(new THREE.BoxGeometry(labelW, labelH * 0.14, 0.017), yellowMat);
  yellowStripe.position.set(width * 0.03, height / 2 + labelH * 0.43, labelZ);
  group.add(yellowStripe);

  // Side label (small blue strip)
  const sideLabelMat = new THREE.MeshBasicMaterial({ color: 0x1a4da1 });
  const sideLabelR = new THREE.Mesh(new THREE.BoxGeometry(0.015, height * 0.3, depth * 0.55), sideLabelMat);
  sideLabelR.position.set(-width / 2 - 0.005, height * 0.55, 0);
  group.add(sideLabelR);

  // Terminals on top (silver, tapered posts)
  const termBaseMat = new THREE.MeshStandardMaterial({ color: 0xb0b8c4, roughness: 0.3, metalness: 0.6 });
  const termTopMat = new THREE.MeshStandardMaterial({ color: 0xd0dae6, roughness: 0.2, metalness: 0.7 });

  const termXOffset = width * 0.38;
  const termY = height + 0.03;

  for (let side = -1; side <= 1; side += 2) {
    // Base
    const termBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.1, 16), termBaseMat);
    termBase.position.set(side * termXOffset, termY + 0.05, 0);
    group.add(termBase);
    // Post
    const termPost = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.18, 16), termBaseMat);
    termPost.position.set(side * termXOffset, termY + 0.18, 0);
    group.add(termPost);
    // Nut
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 6), termTopMat);
    nut.position.set(side * termXOffset, termY + 0.28, 0);
    group.add(nut);
  }

  // Handle recesses on long sides (subtle detail)
  const recessMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.8 });
  for (let side = -1; side <= 1; side += 2) {
    const recess = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.06), recessMat);
    recess.position.set(side * (width * 0.3), height * 0.75, depth / 2 + 0.005);
    group.add(recess);
  }

  return { mesh: group, leds: [] };
}


function createProceduralBatteryRack(batteryCount: number, capacityAh = 100, isLithium = false) {
  const group = new THREE.Group();

  // Layout: batteries per row and number of rows derived from count
  // 2 => 2x1, 4 => 2x2, 6 => 3x2, 8 => 4x2, 12 => 4x3, 16 => 4x4
  const perRow = batteryCount <= 4 ? 2 : batteryCount <= 8 ? (batteryCount / 2) : 4;
  const rows = Math.ceil(batteryCount / perRow);

  // Battery actual size from createProceduralStationaryBattery
  const batW = isLithium ? 4.8 : (capacityAh >= 150 ? 3.2 : capacityAh >= 100 ? 2.8 : capacityAh >= 75 ? 2.4 : 2.0);
  const batD = isLithium ? 3.0 : (capacityAh >= 100 ? 1.3 : 1.0);
  const batH = isLithium ? 1.35 : (capacityAh >= 200 ? 1.4 : capacityAh >= 100 ? 1.1 : 0.9);

  const PAD_X = 0.3; // gap between batteries on X
  const PAD_Y = 0.2; // gap between shelves
  const WALL_T = 0.15; // frame / shelf thickness
  const WHEEL_R = 0.18;

  const totalBatW = perRow * batW + (perRow - 1) * PAD_X;
  const rackW = totalBatW + 0.6;
  const rackD = batD + 0.6;
  const shelfH = batH + PAD_Y + WALL_T;
  const rackH = rows * shelfH + WALL_T + WHEEL_R * 2;

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.3, roughness: 0.6 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.4, roughness: 0.5 });

  // Feet / Wheels
  const wheelGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.1, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([xs, zs]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(xs * (rackW / 2 - 0.22), WHEEL_R, zs * (rackD / 2 - 0.22));
    group.add(wheel);
    const axle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.18), metalMat);
    axle.position.set(xs * (rackW / 2 - 0.22), WHEEL_R * 2 + 0.05, zs * (rackD / 2 - 0.22));
    group.add(axle);
  });

  const frameBase = WHEEL_R * 2; // Y where frame starts

  // Corner pillars (full height)
  const pillarGeo = new THREE.BoxGeometry(0.2, rackH - frameBase, 0.2);
  const pillarMidY = frameBase + (rackH - frameBase) / 2;
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([xs, zs]) => {
    const pillar = new THREE.Mesh(pillarGeo, metalMat);
    pillar.position.set(xs * (rackW / 2 - 0.1), pillarMidY, zs * (rackD / 2 - 0.1));
    pillar.castShadow = true;
    group.add(pillar);
  });

  // Top cap bar
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(rackW, WALL_T, rackD), metalMat);
  topBar.position.y = rackH - WALL_T / 2;
  group.add(topBar);

  // Shelves (one per row, plus a bottom shelf)
  const shelfGeo = new THREE.BoxGeometry(rackW, WALL_T, rackD);
  for (let r = 0; r <= rows; r++) {
    const shelf = new THREE.Mesh(shelfGeo, steelMat);
    shelf.position.y = frameBase + r * shelfH;
    shelf.receiveShadow = true;
    shelf.castShadow = true;
    group.add(shelf);
  }

  // Back horizontal cross-bar per shelf
  const barGeo = new THREE.BoxGeometry(rackW, 0.08, 0.08);
  for (let r = 0; r < rows; r++) {
    const bar = new THREE.Mesh(barGeo, metalMat);
    bar.position.set(0, frameBase + r * shelfH + shelfH * 0.6, -rackD / 2 + 0.05);
    group.add(bar);
  }

  // LED strip on front left pillar
  const ledStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, rackH - frameBase - 0.3, 0.04),
    new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
  );
  ledStrip.position.set(-rackW / 2 + 0.22, frameBase + (rackH - frameBase) / 2, rackD / 2 - 0.14);
  group.add(ledStrip);

  // Place batteries and cables
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6 });
  const redCableMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });

  const createCable = (p1: THREE.Vector3, p2: THREE.Vector3, mat = cableMat, outZ = 0.25, upY = 0.18) => {
    const mid = new THREE.Vector3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 + upY, Math.max(p1.z, p2.z) + outZ);
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    return new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.035, 8, false), mat);
  };

  const termOffset = isLithium ? batW * 0.42 : batW * 0.38;
  const termZ = isLithium ? batD / 2 : 0;
  const shelfThick = WALL_T / 2;

  for (let r = 0; r < rows; r++) {
    const shelfTopY = frameBase + r * shelfH + WALL_T;
    const batBottomY = shelfTopY;
    const termY = isLithium ? batBottomY + batH * 0.6 : batBottomY + batH + 0.32;

    const countInRow = Math.min(perRow, batteryCount - r * perRow);
    const rowTotalW = countInRow * batW + (countInRow - 1) * PAD_X;
    const rowStartX = -rowTotalW / 2 + batW / 2;

    for (let b = 0; b < countInRow; b++) {
      const bat = createProceduralStationaryBattery(capacityAh, isLithium).mesh;
      const batX = rowStartX + b * (batW + PAD_X);
      bat.position.set(batX, batBottomY, 0);
      group.add(bat);

      // Series cable to next battery in row
      if (b < countInRow - 1) {
        const nextX = rowStartX + (b + 1) * (batW + PAD_X);
        group.add(createCable(
          new THREE.Vector3(batX + termOffset, termY, termZ),
          new THREE.Vector3(nextX - termOffset, termY, termZ),
          cableMat, isLithium ? 0.3 : 0.25, isLithium ? 0 : 0.18
        ));
      }
    }

    // Inter-row cable: connect last battery of this row to first of next row (right terminal going down)
    if (r < rows - 1) {
      const thisRowLastX = rowStartX + (countInRow - 1) * (batW + PAD_X);
      const nextRowCountInRow = Math.min(perRow, batteryCount - (r + 1) * perRow);
      const nextRowTotalW = nextRowCountInRow * batW + (nextRowCountInRow - 1) * PAD_X;
      const nextRowStartX = -nextRowTotalW / 2 + batW / 2;
      const nextShelfTopY = frameBase + (r + 1) * shelfH + WALL_T;
      const nextTermY = isLithium ? nextShelfTopY + batH * 0.6 : nextShelfTopY + batH + 0.32;

      group.add(createCable(
        new THREE.Vector3(thisRowLastX + termOffset, termY, termZ),
        new THREE.Vector3(nextRowStartX - termOffset, nextTermY, termZ),
        cableMat, 0.5, 0.0
      ));
    }
  }

  // Output connector on left side
  const firstRowTermY = isLithium ? frameBase + WALL_T + batH * 0.6 : frameBase + WALL_T + batH + 0.32;
  const connectorPos = new THREE.Vector3(-rackW / 2 - 0.3, firstRowTermY, 0);
  const firstBatX = -(perRow * batW + (perRow - 1) * PAD_X) / 2 + batW / 2;
  group.add(createCable(new THREE.Vector3(firstBatX - termOffset, firstRowTermY, termZ), connectorPos, redCableMat, 0.3, 0.1));

  // Anderson connector block on side
  const conn = new THREE.Group();
  conn.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x888888 }))));
  const cRed = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.38), new THREE.MeshStandardMaterial({ color: 0xcc0000 }));
  cRed.position.y = 0.1;
  conn.add(cRed);
  conn.position.copy(connectorPos);
  group.add(conn);

  group.userData.isBatteryRack = true;
  return { mesh: group, slotHeight: shelfH, startY: frameBase + WALL_T, rackHeight: rackH };
}

function createProceduralInverter(powerWatts: number) {
  const group = new THREE.Group();
  const width = 4.8;
  const depth = 1.2;
  const height = 1.8;

  // Left white section (70% width)
  const leftW = width * 0.7;
  const leftMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.1 });
  const leftBody = new THREE.Mesh(new THREE.BoxGeometry(leftW, height, depth), leftMat);
  leftBody.position.set(-width / 2 + leftW / 2, 0, 0);
  leftBody.castShadow = true;
  leftBody.receiveShadow = true;
  group.add(leftBody);

  // Right dark grey section (30% width)
  const rightW = width * 0.3;
  const rightMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.5, metalness: 0.2 });
  const rightBody = new THREE.Mesh(new THREE.BoxGeometry(rightW + 0.02, height + 0.04, depth + 0.04), rightMat);
  rightBody.position.set(width / 2 - rightW / 2, 0, 0);
  rightBody.castShadow = true;
  rightBody.receiveShadow = true;
  group.add(rightBody);

  // 4 Bolts on the grey cover
  const boltMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.8, roughness: 0.2 });
  const bDistX = rightW / 2 - 0.1;
  const bDistY = height / 2 - 0.1;
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([x, y]) => {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16), boltMat);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(width / 2 - rightW / 2 + x * bDistX, y * bDistY, depth / 2 + 0.02);
    group.add(bolt);
  });

  // LCD Screen on the white part
  const lcdBg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.02), new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }));
  lcdBg.position.set(-0.2, 0.2, depth / 2 + 0.01);
  group.add(lcdBg);

  const lcdScreen = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.01), new THREE.MeshBasicMaterial({ color: 0x334155 }));
  lcdScreen.position.set(-0.2, 0.25, depth / 2 + 0.021);
  group.add(lcdScreen);

  // 3 small buttons below LCD
  const btnMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
  for (let i = -1; i <= 1; i++) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16), btnMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(-0.2 + i * 0.15, 0.1, depth / 2 + 0.02);
    group.add(btn);
  }

  // Solis style Logo (Orange sun + text bar)
  const logoColor = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const sun = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 16), logoColor);
  sun.position.set(-width / 2 + 0.4, -height / 2 + 0.3, depth / 2 + 0.01);
  group.add(sun);
  const textBar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.01), logoColor);
  textBar.position.set(-width / 2 + 0.7, -height / 2 + 0.3, depth / 2 + 0.01);
  group.add(textBar);

  // Bottom connectors
  const connMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (let i = 0; i < 4; i++) {
    const conn = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.2), connMat);
    conn.position.set(-width / 2 + 0.8 + i * 0.6, -height / 2 - 0.05, 0);
    group.add(conn);
  }

  // Datalogger Wi-Fi Stick
  const loggerGroup = new THREE.Group();
  const loggerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16), connMat);
  loggerBase.position.y = -height / 2 - 0.05;
  loggerGroup.add(loggerBase);
  const loggerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 16), connMat);
  loggerBody.position.y = -height / 2 - 0.35;
  loggerGroup.add(loggerBody);
  const loggerLed = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.04, 16), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
  loggerLed.position.y = -height / 2 - 0.25;
  loggerGroup.add(loggerLed);
  loggerGroup.position.set(width / 2 - 0.6, 0, 0);
  group.add(loggerGroup);

  // Mounting feet
  const footMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
  const footGeo = new THREE.BoxGeometry(0.2, 0.4, 0.4);
  const foot1 = new THREE.Mesh(footGeo, footMat); foot1.position.set(-width / 2 + 0.1, -height / 2, -depth / 2); group.add(foot1);
  const foot2 = new THREE.Mesh(footGeo, footMat); foot2.position.set(width / 2 - 0.1, -height / 2, -depth / 2); group.add(foot2);

  group.position.y = height / 2;
  return { mesh: group, leds: [loggerLed] };
}

function createProceduralRectifier(modulesCount: number) {
  const group = new THREE.Group();
  const width = 4.8;
  const depth = 2.5;
  const height = 1.8; // 4U

  // Chassis
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0xc0c8d5, metalness: 0.8, roughness: 0.4 });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), chassisMat);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // Front bezel/panel
  const frontGroup = new THREE.Group();
  frontGroup.position.set(0, 0, depth / 2 + 0.05);
  group.add(frontGroup);

  // Rack Mount Ears (Abas de fixação)
  const earMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.4 });
  const earW = 0.2;
  const earH = height;
  const earD = 0.05;
  const leftEar = new THREE.Mesh(new THREE.BoxGeometry(earW, earH, earD), earMat);
  leftEar.position.set(-width / 2 - earW / 2, 0, depth / 2 + 0.05);
  group.add(leftEar);

  const rightEar = leftEar.clone();
  rightEar.position.set(width / 2 + earW / 2, 0, depth / 2 + 0.05);
  group.add(rightEar);

  // Mounting Screws on Ears
  const screwMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.3 });
  const screwGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12);
  screwGeo.rotateX(Math.PI / 2);
  [-1, 1].forEach((ySign) => {
    const sY = ySign * (earH / 2 - 0.2);
    const sl = new THREE.Mesh(screwGeo, screwMat);
    sl.position.set(-width / 2 - earW / 2, sY, depth / 2 + 0.05 + earD / 2 + 0.01);
    group.add(sl);
    const sr = sl.clone();
    sr.position.set(width / 2 + earW / 2, sY, depth / 2 + 0.05 + earD / 2 + 0.01);
    group.add(sr);
  });

  // Top Section (Controller & Rectifier Modules)
  const topH = 0.6;
  const topY = height / 2 - topH / 2 - 0.1;
  const ctrlW = 1.2;
  const ctrlMat = new THREE.MeshStandardMaterial({ color: 0x3b4252, metalness: 0.3, roughness: 0.7 });
  const ctrlBox = new THREE.Mesh(new THREE.BoxGeometry(ctrlW, topH, 0.1), ctrlMat);
  ctrlBox.position.set(-width / 2 + ctrlW / 2 + 0.2, topY, 0);
  frontGroup.add(ctrlBox);

  // LCD on controller
  const lcd = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.12), new THREE.MeshBasicMaterial({ color: 0x88c0d0 }));
  lcd.position.set(-width / 2 + ctrlW / 2 + 0.2, topY + 0.1, 0);
  frontGroup.add(lcd);

  // Controller LED
  const led = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
  led.rotation.x = Math.PI / 2;
  led.position.set(-width / 2 + ctrlW / 2 + 0.2, topY - 0.15, 0.05);
  frontGroup.add(led);

  // Rectifier modules (Right side)
  const modMat = new THREE.MeshStandardMaterial({ color: 0x2e3440, metalness: 0.5, roughness: 0.5 });
  const fanMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const modW = 0.8;
  const startX = -width / 2 + ctrlW + 0.6;
  for (let i = 0; i < Math.min(modulesCount, 4); i++) {
    const mod = new THREE.Mesh(new THREE.BoxGeometry(modW - 0.05, topH, 0.1), modMat);
    mod.position.set(startX + i * modW, topY, 0);
    frontGroup.add(mod);

    // Fans
    const fan1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16), fanMat);
    fan1.rotation.x = Math.PI / 2;
    fan1.position.set(startX + i * modW, topY, 0);
    frontGroup.add(fan1);
  }

  // Middle Section (Breakers)
  const midH = 0.6;
  const midY = topY - topH / 2 - midH / 2 - 0.05;
  const midPanel = new THREE.Mesh(new THREE.BoxGeometry(width - 0.4, midH, 0.05), new THREE.MeshStandardMaterial({ color: 0x4c566a, roughness: 0.8 }));
  midPanel.position.set(0, midY, 0);
  frontGroup.add(midPanel);

  // DIN Rail & Breakers
  const rail = new THREE.Mesh(new THREE.BoxGeometry(width - 0.6, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0xe5e9f0, metalness: 0.8 }));
  rail.position.set(0, midY, 0.02);
  frontGroup.add(rail);

  const breakerMat = new THREE.MeshStandardMaterial({ color: 0x81a1c1, roughness: 0.2 });
  const breakerBodyMat = new THREE.MeshStandardMaterial({ color: 0xd8dee9, roughness: 0.5 });
  for (let i = 0; i < 5; i++) {
    const bBody = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.15), breakerBodyMat);
    bBody.position.set(-width / 4 + i * 0.4, midY, 0.05);
    frontGroup.add(bBody);

    const bToggle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.2), breakerMat);
    bToggle.position.set(-width / 4 + i * 0.4, midY + 0.05, 0.1);
    frontGroup.add(bToggle);
  }

  // Bottom Section (Terminals/Cover)
  const botH = 0.3;
  const botY = midY - midH / 2 - botH / 2 - 0.05;
  const botPanel = new THREE.Mesh(new THREE.BoxGeometry(width - 0.4, botH, 0.1), new THREE.MeshStandardMaterial({ color: 0x2e3440, roughness: 0.7 }));
  botPanel.position.set(0, botY, 0);
  frontGroup.add(botPanel);

  group.position.y = height / 2;
  return { mesh: group, leds: [led] };
}

function createProceduralSolar(powerWatts: number) {
  const group = new THREE.Group();

  // Scale panel count by power: 1kW = 2 panels, each row up to 4 panels wide, max 2 rows
  const panelCount = Math.min(8, Math.max(2, Math.round(powerWatts / 500)));
  const cols = Math.min(4, panelCount);
  const rows = Math.ceil(panelCount / cols);

  // Single panel dimensions (standard 60-cell)
  const pW = 3.2;   // panel width
  const pH = 0.08;  // panel thickness
  const pD = 1.8;   // panel height/depth

  const GAP_X = 0.12; // gap between panels horizontally
  const GAP_Z = 0.15; // gap between rows

  const tilt = Math.PI / 9; // ~20Â° tilt angle (facing south)
  const legH = 2.4;          // tall leg height
  const legH2 = legH * 0.55; // back leg shorter (lower end)

  const totalW = cols * pW + (cols - 1) * GAP_X;
  const totalD = rows * pD + (rows - 1) * GAP_Z;

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.4, metalness: 0.6 });
  const cellMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.1, metalness: 0.35, envMapIntensity: 0.8 });
  const gridMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.3, metalness: 0.8 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.4, metalness: 0.7 });

  // Panel array group (will be tilted)
  const arrayGroup = new THREE.Group();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx >= panelCount) break;

      const px = -totalW / 2 + c * (pW + GAP_X) + pW / 2;
      const pz = -totalD / 2 + r * (pD + GAP_Z) + pD / 2;

      const panelGroup = new THREE.Group();

      // Aluminium frame
      const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(pW, pH, pD), frameMat);
      frameOuter.castShadow = true;
      frameOuter.receiveShadow = true;
      panelGroup.add(frameOuter);

      // Blue glass cells
      const cells = new THREE.Mesh(new THREE.BoxGeometry(pW - 0.06, pH + 0.005, pD - 0.06), cellMat);
      cells.castShadow = false;
      panelGroup.add(cells);

      // Horizontal cell grid lines (6 rows of cells)
      for (let gi = 1; gi < 6; gi++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(pW - 0.08, pH + 0.007, 0.012), gridMat);
        line.position.set(0, 0, -pD / 2 + gi * (pD / 6));
        panelGroup.add(line);
      }
      // Vertical cell grid lines (10 columns of cells)
      for (let gi = 1; gi < 10; gi++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.012, pH + 0.007, pD - 0.08), gridMat);
        line.position.set(-pW / 2 + gi * (pW / 10), 0, 0);
        panelGroup.add(line);
      }

      panelGroup.position.set(px, 0, pz);
      arrayGroup.add(panelGroup);
    }
  }

  // Tilt the panel array
  arrayGroup.rotation.x = -tilt;
  // Raise so bottom clears the rails
  arrayGroup.position.y = legH + (totalD * Math.sin(tilt)) / 2;
  arrayGroup.position.z = -(totalD * Math.cos(tilt)) / 2 + totalD / 2;
  group.add(arrayGroup);

  // Support structure
  // Front & back horizontal rails (run along X axis)
  const railGeo = new THREE.BoxGeometry(totalW + 0.4, 0.1, 0.1);
  const frontRail = new THREE.Mesh(railGeo, railMat);
  frontRail.position.set(0, legH, totalD / 2);
  group.add(frontRail);
  const backRail = new THREE.Mesh(railGeo, railMat);
  backRail.position.set(0, legH2, -totalD / 2);
  group.add(backRail);

  // Longitudinal rails (run along Z axis, at left and right edge)
  const longRailGeo = new THREE.BoxGeometry(0.08, 0.08, totalD + 0.3);
  [-totalW / 2, totalW / 2].forEach(x => {
    const lRail = new THREE.Mesh(longRailGeo, railMat);
    lRail.position.set(x, (legH + legH2) / 2, 0);
    lRail.rotation.x = -tilt;
    lRail.position.y = (legH + legH2) / 2 + Math.sin(tilt) * totalD * 0.1;
    group.add(lRail);
  });

  // Vertical legs â€” front (tall) and back (short), evenly spaced
  const legCols = Math.min(cols + 1, 5);
  for (let c = 0; c < legCols; c++) {
    const lx = -totalW / 2 + c * (totalW / (legCols - 1));

    // Front tall leg
    const frontLegGeo = new THREE.CylinderGeometry(0.07, 0.09, legH, 8);
    const frontLeg = new THREE.Mesh(frontLegGeo, legMat);
    frontLeg.position.set(lx, legH / 2, totalD / 2);
    frontLeg.castShadow = true;
    group.add(frontLeg);

    // Back short leg
    const backLegGeo = new THREE.CylinderGeometry(0.07, 0.09, legH2, 8);
    const backLeg = new THREE.Mesh(backLegGeo, legMat);
    backLeg.position.set(lx, legH2 / 2, -totalD / 2);
    backLeg.castShadow = true;
    group.add(backLeg);

    // Foot plate at base
    const footMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.8 });
    const footF = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.3), footMat);
    footF.position.set(lx, 0.025, totalD / 2);
    group.add(footF);
    const footB = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.3), footMat);
    footB.position.set(lx, 0.025, -totalD / 2);
    group.add(footB);
  }

  // Diagonal braces between front and back legs on far sides
  [-totalW / 2, totalW / 2].forEach(x => {
    const braceLength = Math.sqrt(totalD * totalD + (legH - legH2) * (legH - legH2));
    const braceGeo = new THREE.CylinderGeometry(0.04, 0.04, braceLength, 8);
    const brace = new THREE.Mesh(braceGeo, railMat);
    brace.position.set(x, (legH + legH2) / 2, 0);
    brace.rotation.x = Math.atan2(legH - legH2, totalD);
    group.add(brace);
  });

  return { mesh: group, leds: [] };
}

function createProceduralPatchPanel(ports: number) {
  const group = new THREE.Group();
  const width = 4.8;
  const depth = 1.5;
  const height = 0.42;

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7, metalness: 0.2 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const bezel = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, height + 0.03, 0.02), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }));
  bezel.position.set(0, 0, depth / 2 + 0.01);
  group.add(bezel);

  const portGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
  const portMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.2 });
  const borderGeo = new THREE.BoxGeometry(0.1, 0.1, 0.01);
  const rows = ports > 24 ? 2 : 1;
  const cols = Math.min(ports, 24);
  const startX = -((cols - 1) * 0.15) / 2;
  const startY = rows > 1 ? 0.08 : 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r * 24 + c >= ports) break;
      const px = startX + c * 0.15;
      const py = startY - r * 0.16;
      const border = new THREE.Mesh(borderGeo, borderMat);
      border.position.set(px, py, depth / 2 + 0.02);
      group.add(border);
      const port = new THREE.Mesh(portGeo, portMat);
      port.position.set(px, py, depth / 2 + 0.025);
      group.add(port);
    }
  }

  const label = new THREE.Mesh(new THREE.BoxGeometry(width * 0.55, 0.08, 0.01), new THREE.MeshBasicMaterial({ color: 0x1d4ed8 }));
  label.position.set(-width * 0.15, height / 2 - 0.08, depth / 2 + 0.02);
  group.add(label);

  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.12, height, 0.18), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.2 }));
  earL.position.set(-width / 2 - 0.06, 0, depth / 2 - 0.09);
  const earR = earL.clone(); earR.position.x = width / 2 + 0.06;
  group.add(earL, earR);

  return { mesh: group, leds: [] };
}

const customModelRegistry = new Map<string, THREE.Group>();

// â”€â”€â”€ Structural / Environment Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function createWall(widthM: number) {
  const group = new THREE.Group();
  const scale = 3.5;
  const height = 5 * scale;
  const thickness = 0.25 * scale;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xc0c8d5, roughness: 0.85, metalness: 0.05 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(widthM * scale, height, thickness), wallMat);
  wall.position.y = height / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);
  // Brick-line effect via thin horizontal bars
  const brickMat = new THREE.MeshStandardMaterial({ color: 0xa8b0bd, roughness: 1 });
  const rows = Math.floor(height / (0.4 * scale));
  for (let r = 0; r < rows; r++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(widthM * scale + 0.01, 0.02 * scale, thickness + 0.01), brickMat);
    bar.position.y = (0.4 * scale) * r + (0.2 * scale);
    group.add(bar);
  }
  return group;
}

function createDoor() {
  const group = new THREE.Group();
  const scale = 3.5;
  const wallH = 5 * scale;
  const wallW = 4 * scale;
  const doorH = 2.8 * scale;
  const doorW = 1.4 * scale;
  const thick = 0.25 * scale;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xc0c8d5, roughness: 0.85, metalness: 0.05 });
  const leftW = (wallW - doorW) / 2;
  // Left panel
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(leftW, wallH, thick), wallMat);
  leftWall.position.set(-doorW / 2 - leftW / 2, wallH / 2, 0);
  leftWall.castShadow = true;
  group.add(leftWall);
  // Right panel
  const rightWall = leftWall.clone();
  rightWall.position.x = doorW / 2 + leftW / 2;
  group.add(rightWall);
  // Top panel
  const topSeg = new THREE.Mesh(new THREE.BoxGeometry(doorW, wallH - doorH, thick), wallMat);
  topSeg.position.set(0, doorH + (wallH - doorH) / 2, 0);
  group.add(topSeg);
  // Door leaf
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x8b6a4a, roughness: 0.5, metalness: 0.1 });
  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(doorW - 0.08, doorH - 0.08, 0.09), doorMat);
  doorLeaf.position.set(0, doorH / 2, thick / 2 + 0.04);
  group.add(doorLeaf);
  // Handle
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xd4a843, metalness: 0.2, roughness: 0.15 }));
  handle.position.set(doorW / 2 - 0.2, doorH / 2, thick / 2 + 0.08);
  group.add(handle);
  return group;
}

function createLamp(hexColor: number, intensity: number) {
  const group = new THREE.Group();
  const scale = 3.5;
  const ceilingY = 5 * scale - 0.2;
  const bracketMat = new THREE.MeshStandardMaterial({ color: 0x5a6070, metalness: 0.2 });
  const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.3 * scale, 8), bracketMat);
  bracket.position.y = ceilingY;
  group.add(bracket);
  const housingMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.3, metalness: 0.2 });
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * scale, 0.3 * scale, 0.22 * scale, 16), housingMat);
  housing.position.y = ceilingY - (0.25 * scale);
  group.add(housing);
  const emissiveMat = new THREE.MeshStandardMaterial({
    color: hexColor,
    emissive: new THREE.Color(hexColor),
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * scale, 0.28 * scale, 0.03 * scale, 16), emissiveMat);
  disc.position.y = ceilingY - (0.37 * scale);
  group.add(disc);
  const pointLight = new THREE.PointLight(hexColor, intensity * 2, 25 * scale);
  pointLight.position.y = ceilingY - (0.6 * scale);
  pointLight.castShadow = true;
  group.add(pointLight);
  return group;
}

function createCeiling(widthM: number, depthM: number) {
  const group = new THREE.Group();
  const scale = 3.5;
  const height = 5 * scale;
  const w = widthM * scale;
  const d = depthM * scale;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8090a0, metalness: 0.2, roughness: 0.6 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06 * scale, d), frameMat);
  frame.position.y = height;
  frame.receiveShadow = true;
  group.add(frame);
  const gridMat = new THREE.MeshStandardMaterial({ color: 0xa0b0c0, metalness: 0.4, roughness: 0.7, transparent: true, opacity: 0.6 });
  const gridCountX = Math.max(2, Math.ceil(w / (1.5 * scale)));
  const gridCountZ = Math.max(2, Math.ceil(d / (1.5 * scale)));
  for (let i = 0; i <= gridCountX; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04 * scale, 0.12 * scale, d), gridMat);
    bar.position.set(-w / 2 + i * (w / gridCountX), height - 0.03 * scale, 0);
    group.add(bar);
  }
  for (let j = 0; j <= gridCountZ; j++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12 * scale, 0.04 * scale), gridMat);
    bar.position.set(0, height - 0.03 * scale, -d / 2 + j * (d / gridCountZ));
    group.add(bar);
  }
  return group;
}

const safelyDisposeObject = (obj: THREE.Object3D) => {
  obj.traverse((child) => {
    // 1. Sprites are always procedural and need to be disposed
    if (child instanceof THREE.Sprite || (child as any).isSprite) {
      const sprite = child as THREE.Sprite;
      if (sprite.material) {
        if (sprite.material.map) {
          sprite.material.map.dispose();
        }
        sprite.material.dispose();
      }
      return;
    }

    // 2. Check if child or any parent/ancestor is a custom model
    let isCustom = false;
    let current: THREE.Object3D | null = child;
    while (current) {
      if (current.userData && current.userData.isCustomModel) {
        isCustom = true;
        break;
      }
      current = current.parent;
    }

    if (isCustom) return;

    // 3. Dispose procedural mesh resources
    if (child instanceof THREE.Mesh || (child as any).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        const mats: THREE.Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const anyMat = mat as any;
          if (anyMat.map) anyMat.map.dispose();
          if (anyMat.lightMap) anyMat.lightMap.dispose();
          if (anyMat.emissiveMap) anyMat.emissiveMap.dispose();
          mat.dispose();
        });
      }
    }
  });
};

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function Diagram3D({ onBack, isFullscreen, toggleFullscreen }: { onBack: () => void, isFullscreen?: boolean, toggleFullscreen?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const nodes = useDiagram((s) => s.nodes);
  const edges = useDiagram((s) => s.edges);
  const updateNodeData = useDiagram((s) => s.updateNodeData);
  const addNode = useDiagram((s) => s.addNode);
  const removeNode = useDiagram((s) => s.removeNode);
  const addEdge = useDiagram((s) => s.addEdge);
  const removeEdge = useDiagram((s) => s.removeEdge);
  const updateEdge = useDiagram((s) => s.updateEdge);
  const locations = useDiagram((s) => s.locations);
  const activeLocationId = useDiagram((s) => s.activeLocationId);
  const [connectMode, setConnectMode] = useState(false);
  const [connectPowerMode, setConnectPowerMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  // Refs so the Three.js closure always sees current state
  const connectModeRef = useRef(false);
  const connectPowerModeRef = useRef(false);
  const connectSourceIdRef = useRef<string | null>(null);
  useEffect(() => { connectModeRef.current = connectMode; }, [connectMode]);
  useEffect(() => { connectPowerModeRef.current = connectPowerMode; }, [connectPowerMode]);
  useEffect(() => { connectSourceIdRef.current = connectSourceId; }, [connectSourceId]);

  // Edge (cable) selection
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeLabel, setEdgeLabel] = useState("");
  const [edgeColor, setEdgeColor] = useState("#f97316");
  const selectedEdge = useMemo(() => edges.find(e => e.id === selectedEdgeId), [edges, selectedEdgeId]);
  useEffect(() => {
    if (selectedEdge) {
      setEdgeLabel((selectedEdge.data?.label as string) || "");
      const isPow = selectedEdge.data?.isPower;
      setEdgeColor((selectedEdge.data?.color as string) || (isPow ? "#eab308" : "#f97316"));
    }
  }, [selectedEdgeId, selectedEdge]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingIp, setEditingIp] = useState("");
  const [mountingRackId, setMountingRackId] = useState("");
  const [mountingU, setMountingU] = useState(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [positionZ, setPositionZ] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [sceneVersion, setSceneVersion] = useState(0);

  const [openDoors, setOpenDoors] = useState<Set<string>>(new Set());

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const threeNodesRef = useRef<Map<string, THREE.Group>>(new Map());
  const ledObjectsRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const cablesRef = useRef<THREE.Line[]>([]);
  const cablePulsesRef = useRef<{ line: THREE.Line; progress: number; speed: number; mesh: THREE.Mesh }[]>([]);
  const doorPivotsRef = useRef<Map<string, THREE.Group>>(new Map());
  const doorAnimRef = useRef<Map<string, { target: number; current: number }>>(new Map());
  const loadingUrlsRef = useRef<Set<string>>(new Set());

  const updateNodeDataRef = useRef(updateNodeData);
  const setSelectedNodeIdRef = useRef(setSelectedNodeId);
  const activeNodeIdRef = useRef<string | null>(null);
  const addEdgeRef = useRef(addEdge);
  const setSelectedEdgeIdRef = useRef(setSelectedEdgeId);
  useEffect(() => { updateNodeDataRef.current = updateNodeData; }, [updateNodeData]);
  useEffect(() => { setSelectedNodeIdRef.current = setSelectedNodeId; }, [setSelectedNodeId]);
  useEffect(() => { activeNodeIdRef.current = selectedNodeId; }, [selectedNodeId]);
  useEffect(() => { addEdgeRef.current = addEdge; }, [addEdge]);
  useEffect(() => { setSelectedEdgeIdRef.current = setSelectedEdgeId; }, [setSelectedEdgeId]);
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);

  useEffect(() => {
    if (selectedNode) {
      setEditingName((selectedNode.data.name as string) || "");
      setEditingIp((selectedNode.data.ip as string | undefined) || "");
      setMountingRackId((selectedNode.data.rackId as string | undefined) || "none");
      setMountingU(selectedNode.data.rackUnit || 1);
      const p3d = selectedNode.data.position3d || { x: 0, y: 0, z: 0 };
      setPositionX(p3d.x); setPositionY(p3d.y); setPositionZ(p3d.z);
      const rot = selectedNode.data.rotation3d || { x: 0, y: 0, z: 0 };
      setRotationY(rot.y as number);
    } else {
      setEditingName(""); setEditingIp(""); setMountingRackId(""); setMountingU(1);
    }
  }, [selectedNodeId, selectedNode]);

  const racksList = useMemo(() => {
    if (!selectedNode) return [];
    if (selectedNode.data.kind === "stationary_battery") {
      return nodes.filter((n) => n.data.kind === "battery_rack");
    }
    return nodes.filter((n) => n.data.kind === "rack");
  }, [nodes, selectedNode]);

  const updateShadowFlags = (root: THREE.Object3D | null) => {
    if (!root) return;
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  };

  const checkRackCollision = (rackId: string, uSlot: number, excludeNodeId: string, currentUHeight = 1) => {
    const devicesInRack = nodes.filter((n) => n.id !== excludeNodeId && n.data.rackId === rackId);
    for (const dev of devicesInRack) {
      const devSlot = dev.data.rackUnit ?? 1;
      const devHeight = dev.data.rackUHeight ?? 1;
      if (uSlot <= devSlot + devHeight - 1 && uSlot + currentUHeight - 1 >= devSlot) return dev;
    }
    return null;
  };

  const saveNodeSettings = () => {
    if (!selectedNodeId || !selectedNode) return;
    const patch: Partial<NodeData> = { name: editingName };

    const isStructural = ["rack", "battery_rack", "wall", "door", "lamp", "ceiling"].includes(selectedNode.data.kind);

    if (isStructural) {
      patch.position3d = { x: positionX, y: positionY, z: positionZ };
      patch.rotation3d = { x: 0, y: rotationY, z: 0 };
    } else {
      if ("ip" in selectedNode.data) patch.ip = editingIp;

      if (mountingRackId === "none") {
        patch.rackId = undefined;
        patch.rackUnit = undefined;
        patch.position3d = { x: positionX, y: positionY, z: positionZ };
        patch.rotation3d = { x: 0, y: rotationY, z: 0 };
      } else {
        const collidesWith = checkRackCollision(mountingRackId, mountingU, selectedNodeId, selectedNode.data.rackUHeight ?? 1);
        if (collidesWith) { toast.error(`Falha ao montar: Slot U${mountingU} colide com "${collidesWith.data.name}"`); return; }
        const rackNode = nodes.find((n) => n.id === mountingRackId);
        const maxU = (rackNode?.data as any)?.units ?? (rackNode?.data as any)?.shelves ?? (rackNode?.data as any)?.batteryCount ?? 24;
        const uHeight = selectedNode.data.rackUHeight ?? 1;
        if (mountingU + uHeight - 1 > maxU) { toast.error(`Falha ao montar: Altura excede o limite do Rack (${maxU}U)`); return; }
        patch.rackId = mountingRackId;
        patch.rackUnit = mountingU;
        patch.position3d = undefined;
        patch.rotation3d = undefined;
      }
    }

    updateNodeData(selectedNodeId, patch);
    toast.success("ConfiguraÃ§Ãµes atualizadas!");
  };

  const removeFromRack = () => {
    if (!selectedNode || !selectedNode.data.rackId) return;
    const rackNode = nodes.find((n) => n.id === selectedNode.data.rackId);
    const rackPos = rackNode?.data.position3d || { x: 0, y: 0, z: 0 };
    updateNodeData(selectedNodeId!, {
      rackId: undefined,
      rackUnit: undefined,
      position3d: { x: (rackPos.x ?? 0) + 4, y: 1, z: (rackPos.z ?? 0) + 3 },
      rotation3d: { x: 0, y: 0, z: 0 },
    });
    setMountingRackId("none");
    toast.success(`"${selectedNode.data.name}" removido do rack!`);
  };

  const toggleRackDoor = (rackId: string) => {
    setOpenDoors((prev) => {
      const next = new Set(prev);
      if (next.has(rackId)) {
        next.delete(rackId);
        const anim = doorAnimRef.current.get(rackId);
        if (anim) anim.target = 0;
      } else {
        next.add(rackId);
        const anim = doorAnimRef.current.get(rackId);
        if (anim) anim.target = -Math.PI * 0.55;
        else doorAnimRef.current.set(rackId, { target: -Math.PI * 0.55, current: 0 });
      }
      return next;
    });
  };

  // â”€â”€â”€ Main Three.js mount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const aspect = width / height;
    const frustumSize = 20;
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      -100,
      1000
    );
    // True isometric angle — closer initial position
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = true;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controls.enablePan = true;

    cameraRef.current = camera;
    controlsRef.current = controls;

    // â”€â”€ WASD Movement State â”€â”€
    const keys = { w: false, a: false, s: false, d: false, arrowup: false, arrowdown: false, arrowleft: false, arrowright: false };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k in keys) keys[k as keyof typeof keys] = true;
      // Escape cancels connect mode
      if (e.key === "Escape" && connectModeRef.current) {
        setConnectMode(false);
        setConnectPowerMode(false);
        setConnectSourceId(null);
        toast.info("Modo de conexão cancelado.");
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k in keys) keys[k as keyof typeof keys] = false;

      if (activeNodeIdRef.current && k.startsWith("arrow")) {
        const mesh = threeNodesRef.current.get(activeNodeIdRef.current);
        if (mesh) {
          const newPos = {
            x: Number(mesh.position.x.toFixed(2)),
            y: Number(mesh.position.y.toFixed(2)),
            z: Number(mesh.position.z.toFixed(2))
          };
          updateNodeDataRef.current(activeNodeIdRef.current, { position3d: newPos });
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Soft Isometric Lighting (Hemisphere + Directional)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.4);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(24, 34, 18);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 4096;
    mainLight.shadow.mapSize.height = 4096;
    mainLight.shadow.camera.left = -90;
    mainLight.shadow.camera.right = 90;
    mainLight.shadow.camera.top = 90;
    mainLight.shadow.camera.bottom = -90;
    mainLight.shadow.camera.far = 300;
    mainLight.shadow.radius = 3.5;
    mainLight.shadow.bias = -0.00016;
    mainLight.shadow.normalBias = 0.025;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.55);
    fillLight.position.set(-24, 18, -20);
    fillLight.castShadow = false;
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.35);
    rimLight.position.set(12, 14, -28);
    scene.add(rimLight);

    const floorMat = new THREE.MeshStandardMaterial({ roughness: 0.1, metalness: 0.0, color: 0xffffff });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    let gridHelper: THREE.GridHelper | null = null;

    // Responsive theme handling
    const updateThemeColors = () => {
      const isLight = document.documentElement.classList.contains("light");
      const bgColor = isLight ? 0xcbd5e1 : 0x080d1c;
      const floorColor = isLight ? 0x94a3b8 : 0x050918;
      const grid1 = isLight ? 0x475569 : 0x1e3a5f;
      const grid2 = isLight ? 0x64748b : 0x0d1f3c;

      if (isLight) {
        hemiLight.intensity = 0.35;
        ambientLight.intensity = 0.35;
        mainLight.intensity = 1.5;
      } else {
        hemiLight.intensity = 0.15;
        ambientLight.intensity = 0.15;
        mainLight.intensity = 1.2;
      }

      scene.background = new THREE.Color(bgColor);
      scene.fog = new THREE.FogExp2(bgColor, 0.012);

      if (floor.material instanceof THREE.MeshStandardMaterial) {
        floor.material.color.setHex(floorColor);
      }

      if (gridHelper) scene.remove(gridHelper);
      gridHelper = new THREE.GridHelper(250, 120, grid1, grid2);
      gridHelper.position.y = -0.01;
      scene.add(gridHelper);
    };

    updateThemeColors();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "class") {
          updateThemeColors();
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });

    // â”€â”€ Raycaster + drag system â”€â”€
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let dragNodeId: string | null = null;
    let hasMoved = false;
    let mouseDownX = 0;
    let mouseDownY = 0;
    const dragPlane = new THREE.Plane();
    const dragIntersect = new THREE.Vector3();
    const dragOffset = new THREE.Vector3();

    function getClickableObjects() {
      const objs: THREE.Object3D[] = [];
      threeNodesRef.current.forEach((group, id) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.userData.nodeId = id;
            objs.push(child);
          }
        });
      });
      return objs;
    }

    function getNDC(e: MouseEvent) {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    const handleMouseDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      getNDC(e);
      raycaster.setFromCamera(mouse, camera);

      // ── Connect mode: click any node to source/target ──
      if (connectModeRef.current) {
        const hits = raycaster.intersectObjects(getClickableObjects());
        if (hits.length > 0) {
          e.stopPropagation();
          const nodeId = hits[0].object.userData.nodeId as string;
          const srcId = connectSourceIdRef.current;
          if (!srcId) {
            // First click → set source, keep mode on so user can pick target
            setConnectSourceId(nodeId);
            toast.info(`Clique no equipamento de destino (${connectPowerModeRef.current ? '⚡ Energia' : '📡 Dados'}).`);
          } else {
            if (srcId !== nodeId) {
              const newEdgeId = `e-${srcId}-${nodeId}-${Date.now()}`;
              const isPow = connectPowerModeRef.current;
              addEdgeRef.current({
                id: newEdgeId,
                source: srcId,
                target: nodeId,
                data: { isPower: isPow },
                animated: true,
                className: isPow ? "power-cable animated" : "animated",
                type: "deletable",
              });
              toast.success(`Conectado! Clique em outro para continuar ou pressione Esc para sair.`);
            }
            // Keep mode alive – only reset source so user can keep chaining
            setConnectSourceId(null);
          }
        }
        return;
      }

      const hits = raycaster.intersectObjects(getClickableObjects());
      if (hits.length > 0) {
        const nodeId = hits[0].object.userData.nodeId as string;
        const mesh = threeNodesRef.current.get(nodeId);
        if (!mesh) return;
        e.stopPropagation();
        setSelectedEdgeIdRef.current(null);
        isDragging = true;
        hasMoved = false;
        dragNodeId = nodeId;
        mouseDownX = e.clientX;
        mouseDownY = e.clientY;
        dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), mesh.position);
        if (raycaster.ray.intersectPlane(dragPlane, dragIntersect)) {
          dragOffset.copy(dragIntersect).sub(mesh.position);
        }
        controls.enabled = false;
        renderer.domElement.style.cursor = "grabbing";
        return;
      }

      // ── Click on cable tube ──
      const cableHits = raycaster.intersectObjects(cablesRef.current as THREE.Object3D[]);
      if (cableHits.length > 0) {
        e.stopPropagation();
        const edgeId = cableHits[0].object.userData.edgeId as string | undefined;
        if (edgeId) setSelectedEdgeIdRef.current(edgeId);
      }
    };

    const handleMouseMove = (e: PointerEvent) => {
      if (isDragging) { e.stopPropagation(); }
      if (!isDragging) {
        getNDC(e);
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(getClickableObjects());
        renderer.domElement.style.cursor = hits.length > 0 ? "grab" : "default";
        return;
      }
      const dx = e.clientX - mouseDownX;
      const dy = e.clientY - mouseDownY;
      if (!hasMoved && Math.sqrt(dx * dx + dy * dy) > 5) hasMoved = true;
      if (!hasMoved || !dragNodeId) return;
      getNDC(e);
      raycaster.setFromCamera(mouse, camera);
      const mesh = threeNodesRef.current.get(dragNodeId);
      if (!mesh) return;
      if (raycaster.ray.intersectPlane(dragPlane, dragIntersect)) {
        mesh.position.set(dragIntersect.x - dragOffset.x, mesh.position.y, dragIntersect.z - dragOffset.z);
      }
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      controls.enabled = true;
      renderer.domElement.style.cursor = "default";
      if (hasMoved && dragNodeId) {
        const mesh = threeNodesRef.current.get(dragNodeId);
        if (mesh) {
          updateNodeDataRef.current(dragNodeId, {
            position3d: { x: parseFloat(mesh.position.x.toFixed(2)), y: parseFloat(mesh.position.y.toFixed(2)), z: parseFloat(mesh.position.z.toFixed(2)) },
            rackId: undefined,
            rackUnit: undefined,
          });
        }
      } else if (!hasMoved && dragNodeId) {
        setSelectedNodeIdRef.current(dragNodeId);
        setSelectedEdgeIdRef.current(null);
      }
      isDragging = false;
      hasMoved = false;
      dragNodeId = null;
    };

    renderer.domElement.addEventListener("pointerdown", handleMouseDown as EventListener, true);
    renderer.domElement.addEventListener("pointermove", handleMouseMove as EventListener, true);
    renderer.domElement.addEventListener("pointerup", handleMouseUp as EventListener, true);
    renderer.domElement.addEventListener("pointercancel", handleMouseUp as EventListener, true);

    // Rotate selected object with mouse wheel while holding Shift
    const handleWheel = (e: WheelEvent) => {
      if (!selectedNodeId) return;
      if (!e.shiftKey) return; // require Shift to avoid interfering with zoom
      e.preventDefault();
      const mesh = threeNodesRef.current.get(selectedNodeId);
      if (!mesh) return;
      mesh.rotation.y += e.deltaY * 0.01;
      // persist rotation
      updateNodeDataRef.current(selectedNodeId, { rotation3d: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z } });
    };
    renderer.domElement.addEventListener("wheel", handleWheel as EventListener, { passive: false });

    // â”€â”€ Animation loop â”€â”€
    let lastTime = performance.now();
    const tick = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // FPS WASD Movement
      const moveSpeed = 15 * dt;
      const activeId = activeNodeIdRef.current;
      const hasArrowKey = keys.arrowup || keys.arrowdown || keys.arrowleft || keys.arrowright;

      if (activeId && hasArrowKey) {
        const mesh = threeNodesRef.current.get(activeId);
        if (mesh) {
          const step = 2 * dt;
          if (keys.arrowup) mesh.position.y += step;
          if (keys.arrowdown) mesh.position.y -= step;
          if (keys.arrowleft) mesh.position.x -= step;
          if (keys.arrowright) mesh.position.x += step;
        }
      }

      const camArrowMove = !activeId && hasArrowKey;
      if (keys.w || keys.s || keys.a || keys.d || camArrowMove) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        const move = new THREE.Vector3();

        if (keys.w || (!activeId && keys.arrowup)) move.add(forward);
        if (keys.s || (!activeId && keys.arrowdown)) move.sub(forward);
        if (keys.a || (!activeId && keys.arrowleft)) move.sub(right);
        if (keys.d || (!activeId && keys.arrowright)) move.add(right);

        if (move.lengthSq() > 0) {
          move.normalize().multiplyScalar(moveSpeed);
          camera.position.add(move);
          controls.target.add(move);
        }
      }

      ledObjectsRef.current.forEach((leds) => {
        leds.forEach((led) => { if (Math.random() < 0.05) led.visible = !led.visible; });
      });

      cablePulsesRef.current.forEach((pulse) => {
        pulse.progress += pulse.speed * dt;
        if (pulse.progress > 1.0) pulse.progress = 0;
        const curve = pulse.mesh.userData.curve;
        if (curve) {
          try {
            const pt = curve.getPointAt(pulse.progress);
            if (pt && typeof pt.x === "number" && !isNaN(pt.x)) {
              pulse.mesh.position.copy(pt);
              pulse.mesh.visible = true;
            } else {
              pulse.mesh.visible = false;
            }
          } catch {
            pulse.mesh.visible = false;
          }
        }
      });

      doorAnimRef.current.forEach((anim, rackId) => {
        const pivot = doorPivotsRef.current.get(rackId);
        if (!pivot) return;
        const diff = anim.target - anim.current;
        if (Math.abs(diff) > 0.001) {
          anim.current += diff * Math.min(dt * 5, 1);
          pivot.rotation.y = anim.current;
        }
      });

      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      const newAspect = w / h;
      const frustumSize = 20;
      (camera as THREE.OrthographicCamera).left = (frustumSize * newAspect) / -2;
      (camera as THREE.OrthographicCamera).right = (frustumSize * newAspect) / 2;
      (camera as THREE.OrthographicCamera).top = frustumSize / 2;
      (camera as THREE.OrthographicCamera).bottom = frustumSize / -2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      if (renderer?.domElement) {
        renderer.domElement.removeEventListener("pointerdown", handleMouseDown as EventListener, true);
        renderer.domElement.removeEventListener("pointermove", handleMouseMove as EventListener, true);
        renderer.domElement.removeEventListener("pointerup", handleMouseUp as EventListener, true);
        renderer.domElement.removeEventListener("pointercancel", handleMouseUp as EventListener, true);
        renderer.domElement.removeEventListener("wheel", handleWheel as EventListener);
        renderer.dispose();
      }
      threeNodesRef.current.forEach((mesh) => safelyDisposeObject(mesh));
      cablesRef.current.forEach((line) => safelyDisposeObject(line));
      cablePulsesRef.current.forEach((pulse) => safelyDisposeObject(pulse.mesh));
      if (gridHelper) {
        gridHelper.geometry.dispose();
        if (Array.isArray(gridHelper.material)) {
          gridHelper.material.forEach((m) => m.dispose());
        } else {
          gridHelper.material.dispose();
        }
      }
      if (floor) {
        floor.geometry.dispose();
        if (Array.isArray(floor.material)) {
          floor.material.forEach((m) => m.dispose());
        } else {
          floor.material.dispose();
        }
      }
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, []);

  // â”€â”€â”€ Sync scene with store â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    threeNodesRef.current.forEach((mesh) => {
      safelyDisposeObject(mesh);
      scene.remove(mesh);
    });
    threeNodesRef.current.clear();
    ledObjectsRef.current.clear();
    doorPivotsRef.current.clear();

    cablesRef.current.forEach((line) => {
      safelyDisposeObject(line);
      scene.remove(line);
    });
    cablesRef.current.splice(0);

    cablePulsesRef.current.forEach((pulse) => {
      safelyDisposeObject(pulse.mesh);
      scene.remove(pulse.mesh);
    });
    cablePulsesRef.current = [];

    const computedPositions = new Map<string, THREE.Vector3>();

    // Pass 1: Racks and battery racks
    nodes.filter((n) => n.data.kind === "rack" || n.data.kind === "battery_rack").forEach((node) => {
      const d = node.data as RackNodeData;
      let mesh: THREE.Group;
      let slotHeight = 0;
      let startY = 0;
      let doorPivot: THREE.Group | null = null;

      if (node.data.kind === "rack") {
        const rackType = (d.rackType as any) || "closed";
        const result = createProceduralRack(d.units, rackType);
        mesh = result.mesh;
        doorPivot = result.doorPivot;
        slotHeight = result.slotHeight;
        startY = result.startY;
      } else {
        const batteryRackData = node.data as any;
        const result = createProceduralBatteryRack(
          batteryRackData.batteryCount ?? batteryRackData.shelves ?? 4,
          batteryRackData.capacityAh ?? 100,
          batteryRackData.isLithium ?? false
        );
        mesh = result.mesh;
        slotHeight = result.slotHeight;
        startY = result.startY;
      }

      const pos = d.position3d || { x: (nodes.indexOf(node) - 1) * 6, y: 0, z: -2 };
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.set(0, (d.rotation3d as any)?.y || 0, 0);

      // Store all rack geometry metadata so device mounting code can access it
      mesh.userData.slotHeight = slotHeight;
      mesh.userData.startY = startY;
      const rackResult = node.data.kind === "rack"
        ? (node.data.rackType as any) === "open"
          ? { rackType: "open", innerWidth: 5.2, innerDepth: 2.4, frontRailZ: 0.0 }
          : { rackType: "closed", innerWidth: 5.2, innerDepth: 4.0, frontRailZ: 1.75 }
        : { rackType: "battery", innerWidth: 4.8, innerDepth: 2.0, frontRailZ: 0.9 };
      mesh.userData.rackType = rackResult.rackType;
      mesh.userData.innerWidth = rackResult.innerWidth;
      mesh.userData.innerDepth = rackResult.innerDepth;
      mesh.userData.frontRailZ = rackResult.frontRailZ;

      computedPositions.set(node.id, new THREE.Vector3(pos.x, pos.y + (d.units * slotHeight) / 2, pos.z));

      if (doorPivot) {
        doorPivotsRef.current.set(node.id, doorPivot);
        if (!doorAnimRef.current.has(node.id)) {
          doorAnimRef.current.set(node.id, { target: 0, current: 0 });
        }
        const existing = doorAnimRef.current.get(node.id)!;
        const isOpen = openDoors.has(node.id);
        existing.target = isOpen ? -Math.PI * 0.55 : 0;
        doorPivot.rotation.y = existing.current;
      }

      // Add text label sprite for rack
      const labelSprite = createTextSprite(node.data.name || "Rack");
      labelSprite.position.set(0, (d.units || 12) * slotHeight + 1.5, 0); // Position above the rack
      mesh.add(labelSprite);

      scene.add(mesh);
      threeNodesRef.current.set(node.id, mesh);
    });

    // Pass 2: Devices
    nodes.filter((n) => ["switch", "camera", "olt", "dio", "router", "server", "stationary_battery", "inverter", "solar", "patchpanel", "dwdm", "rectifier"].includes(n.data.kind as string)).forEach((node) => {
      const isSwitch = ["switch", "olt", "dio", "router", "server", "stationary_battery", "inverter", "patchpanel", "dwdm", "rectifier"].includes(node.data.kind as string);
      let deviceGroup: THREE.Group | null = null;
      let ledList: THREE.Mesh[] = [];

      if (node.data.customModelUrl && customModelRegistry.has(node.data.customModelUrl)) {
        const cloned = customModelRegistry.get(node.data.customModelUrl)!.clone();
        cloned.userData = { ...cloned.userData, isCustomModel: true };
        deviceGroup = new THREE.Group();
        deviceGroup.add(cloned);
        deviceGroup.userData.isCustomModel = true;
      } else if (node.data.customModelUrl) {
        const modelUrl = node.data.customModelUrl;
        if (!loadingUrlsRef.current.has(modelUrl)) {
          loadingUrlsRef.current.add(modelUrl);
          loadCustomModelAsync(node.id, modelUrl, (node.data.customModelName as string) ?? "", isSwitch ? "switch" : "camera", (node.data.ports as number) ?? 8);
        }
        deviceGroup = new THREE.Group();
      }

      if (!deviceGroup || deviceGroup.children.length === 0) {
        deviceGroup = new THREE.Group();
        if (node.data.kind === "switch") {
          const swData = node.data as SwitchNodeData;
          const { mesh, leds } = createProceduralSwitch(swData.ports, 5);
          deviceGroup.add(mesh);
          ledList = leds;
        } else if (node.data.kind === "olt") {
          const oltData = node.data as any;
          const { mesh, leds } = createProceduralOLT(oltData.ponPorts ?? 8, oltData.uplinkPorts ?? 4);
          deviceGroup.add(mesh);
          ledList = leds;
        } else if (node.data.kind === "dio") {
          const dioData = node.data as any;
          const { mesh, leds } = createProceduralDIO(dioData.ports ?? 24, dioData.connectorType ?? "SC/APC");
          deviceGroup.add(mesh);
          ledList = leds;
        } else if (node.data.kind === "dwdm") {
          const { mesh, leds } = createProceduralDwdm();
          deviceGroup.add(mesh);
          ledList = leds;
        } else if (node.data.kind === "rectifier") {
          const rectData = node.data as any;
          const { mesh, leds } = createProceduralRectifier(rectData.modules ?? 3);
          deviceGroup.add(mesh);
          ledList = leds;
        } else if (node.data.kind === "router") {
          const routerData = node.data as any;
          const { mesh, leds } = createProceduralRouter(routerData.interfaces ?? 12);
          deviceGroup.add(mesh);
          ledList = leds;
        } else if (node.data.kind === "server") {
          const serverData = node.data as any;
          const { mesh, leds } = createProceduralServer(serverData.diskCount ?? 4);
          deviceGroup.add(mesh);
          ledList = leds;
        } else if (node.data.kind === "stationary_battery") {
          const batData = node.data as any;
          const { mesh, leds } = createProceduralStationaryBattery(batData.capacityAh ?? 100, batData.isLithium);
          deviceGroup.add(mesh);
          ledList = leds;
        } else if (node.data.kind === "inverter") {
          const invData = node.data as any;
          const { mesh, leds } = createProceduralInverter(invData.powerWatts ?? 3000);
          deviceGroup.add(mesh);
          ledList = leds;
        } else if (node.data.kind === "solar") {
          const solarData = node.data as any;
          const { mesh, leds } = createProceduralSolar(solarData.powerWatts ?? 550);
          deviceGroup.add(mesh);
          ledList = leds;
        } else if (node.data.kind === "patchpanel") {
          const ppData = node.data as any;
          const { mesh, leds } = createProceduralPatchPanel(ppData.ports ?? 24);
          deviceGroup.add(mesh);
          ledList = leds;
        } else {
          const camData = node.data as CameraNodeData;
          const { mesh } = createProceduralCamera(camData.cameraType);
          deviceGroup.add(mesh);
        }
      }

      // Add text label sprite — small crisp version inside racks, full-size above free devices
      if (node.data.rackId) {
        const labelSprite = createSmallTextSprite(node.data.name || "Dispositivo");
        labelSprite.position.set(0, 0, 0.55); // slightly in front of the device face
        deviceGroup.add(labelSprite);
      } else {
        const labelSprite = createTextSprite(node.data.name || "Dispositivo");
        labelSprite.position.set(0, 1.5, 0);
        deviceGroup.add(labelSprite);
      }

      if (node.data.rackId) {
        const rackGroup = threeNodesRef.current.get(node.data.rackId);
        if (rackGroup) {
          const slotH: number = rackGroup.userData.slotHeight ?? 0.22;
          const startY: number = rackGroup.userData.startY ?? 0.25;
          const frontRailZ: number = rackGroup.userData.frontRailZ ?? 1.75;
          const innerWidth: number = rackGroup.userData.innerWidth ?? 5.2;
          const innerDepth: number = rackGroup.userData.innerDepth ?? 4.0;

          // Determine how many U this device should occupy
          const kindUHeightMap: Record<string, number> = {
            switch: 2, olt: 4, dio: 2, router: 4, server: 2,
            stationary_battery: 6, inverter: 3, patchpanel: 1,
            dwdm: 14, rectifier: 4,
          };
          const autoUHeight = kindUHeightMap[node.data.kind as string] ?? 2;
          const uSlot = node.data.rackUnit ?? 1;
          const uHeight = node.data.rackUHeight ?? autoUHeight;

          // Get the natural bounding box of the device
          const devBox = new THREE.Box3().setFromObject(deviceGroup);
          const devSize = new THREE.Vector3();
          devBox.getSize(devSize);
          const devCenter = new THREE.Vector3();
          devBox.getCenter(devCenter);

          // Target dimensions inside the rack
          const targetH = uHeight * slotH;       // exact U-slot height
          const targetW = innerWidth - 0.1;       // slight gap from rails
          const targetD = innerDepth - 0.35;      // leave room for cable management

          // Scale device to fit the rack slot exactly:
          // scaleY = exact U height, scaleX = full rack width, scaleZ = fit depth
          const scaleY = devSize.y > 0 ? targetH / devSize.y : 1;
          const scaleX = devSize.x > 0 ? targetW / devSize.x : 1;
          const scaleZ = devSize.z > 0 ? Math.min(targetD / devSize.z, 1.2) : 1;
          deviceGroup.scale.set(scaleX, scaleY, scaleZ);

          // Recompute bounding box after scaling
          const scaledBox = new THREE.Box3().setFromObject(deviceGroup);
          const scaledSize = new THREE.Vector3();
          scaledBox.getSize(scaledSize);
          const scaledCenter = new THREE.Vector3();
          scaledBox.getCenter(scaledCenter);

          // Y: bottom of this U-slot + half the device height
          const slotBottomY = startY + (uSlot - 1) * slotH;
          const localY = slotBottomY + scaledSize.y / 2 - scaledCenter.y + deviceGroup.position.y;

          // Z: front face of device flush with front rail
          // frontRailZ is where the rail sits in rack-local space
          // device front face = frontRailZ, so center Z = frontRailZ - scaledSize.z/2
          const localZ = frontRailZ - scaledSize.z / 2 - scaledCenter.z + deviceGroup.position.z;

          // X: centered in the rack
          const localX = -scaledCenter.x + deviceGroup.position.x;

          deviceGroup.position.set(localX, localY, localZ);
          rackGroup.add(deviceGroup);
          threeNodesRef.current.set(node.id, deviceGroup);
          const absPos = new THREE.Vector3();
          deviceGroup.getWorldPosition(absPos);
          computedPositions.set(node.id, absPos);
          return;
        }
      }

      const dPos = node.data.position3d || { x: (nodes.indexOf(node) * 3) - 4, y: 0, z: 4 };
      deviceGroup.position.set((dPos as any).x, (dPos as any).y, (dPos as any).z);
      deviceGroup.rotation.set(0, (node.data.rotation3d as any)?.y || 0, 0);
      computedPositions.set(node.id, new THREE.Vector3((dPos as any).x, (dPos as any).y, (dPos as any).z));
      scene.add(deviceGroup);
      threeNodesRef.current.set(node.id, deviceGroup);
      if (ledList.length > 0) ledObjectsRef.current.set(node.id, ledList);
    });

    // Pass 3: Structural elements
    nodes.filter((n) => ["wall", "door", "lamp", "ceiling", "floor"].includes(n.data.kind as string)).forEach((node) => {
      const d = node.data as any;
      const pos = d.position3d || { x: (nodes.indexOf(node) * 7), y: 0, z: -10 };
      let structGroup: THREE.Group;

      if (d.kind === "wall") {
        structGroup = createWall(d.width ?? 10);
      } else if (d.kind === "door") {
        structGroup = createDoor();
      } else if (d.kind === "lamp") {
        const hexStr = (d.color ?? "#fffbe8").replace("#", "");
        structGroup = createLamp(parseInt(hexStr, 16), d.intensity ?? 2);
      } else if (d.kind === "ceiling") {
        structGroup = createCeiling(15, 15);
      } else if (d.kind === "floor") {
        structGroup = new THREE.Group();
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8, metalness: 0.1 });
        const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(d.width ?? 10, d.width ?? 10), floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.receiveShadow = true;
        structGroup.add(floorMesh);
      } else {
        return;
      }

      structGroup.position.set(pos.x, pos.y, pos.z);
      structGroup.rotation.set(0, d.rotation3d?.y || 0, 0);
      scene.add(structGroup);
      threeNodesRef.current.set(node.id, structGroup);
    });

    // Pass 4: Cables
    edges.forEach((edge) => {
      const p1 = computedPositions.get(edge.source);
      const p2 = computedPositions.get(edge.target);
      if (!p1 || !p2) return;

      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      const getEscapePath = (p: THREE.Vector3, node: any) => {
        if (node?.data?.rackId) {
          const rackGroup = threeNodesRef.current.get(node.data.rackId);
          if (rackGroup) {
            const offset = new THREE.Vector3(0, 0, -1.8);
            offset.applyQuaternion(rackGroup.quaternion);
            const pEscape = p.clone().add(offset);
            return { pEscape, pFloor: new THREE.Vector3(pEscape.x, 0.05, pEscape.z) };
          }
        }
        return { pEscape: p.clone(), pFloor: new THREE.Vector3(p.x, Math.max(0.05, p.y), p.z) };
      };

      const src = getEscapePath(p1, sourceNode);
      const tgt = getEscapePath(p2, targetNode);

      const rawPathPoints: THREE.Vector3[] = [];
      if (sourceNode?.data?.rackId) rawPathPoints.push(p1.clone(), src.pEscape);
      else rawPathPoints.push(p1.clone());

      const midPoint = new THREE.Vector3().lerpVectors(src.pFloor, tgt.pFloor, 0.5);
      midPoint.y = 0.05;
      rawPathPoints.push(src.pFloor, midPoint, tgt.pFloor);

      if (targetNode?.data?.rackId) rawPathPoints.push(tgt.pEscape, p2.clone());
      else rawPathPoints.push(p2.clone());

      // Deduplicate adjacent near-identical points (causes CatmullRom to produce NaN)
      const MIN_SEP = 0.001;
      const pathPoints: THREE.Vector3[] = [rawPathPoints[0]];
      for (let i = 1; i < rawPathPoints.length; i++) {
        if (rawPathPoints[i].distanceTo(pathPoints[pathPoints.length - 1]) > MIN_SEP) {
          pathPoints.push(rawPathPoints[i]);
        }
      }

      // Need at least 2 distinct points to form a curve
      if (pathPoints.length < 2) return;

      // Create initial curve and strictly clamp all interpolated points above floor boundary Y = 0.05
      const rawCurve = new THREE.CatmullRomCurve3(pathPoints, false, "chordal", 0.5);
      const sampledPoints = rawCurve.getPoints(64);
      const minFloorY = 0.05;
      const clampedPoints = sampledPoints.map((pt) => {
        if (pt.y < minFloorY) pt.y = minFloorY;
        return pt;
      });

      const curve = new THREE.CatmullRomCurve3(clampedPoints, false, "chordal", 0.3);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.04, 8, false);

      const isOffline = sourceNode?.data.status === "offline" || targetNode?.data.status === "offline";
      const isPower = edge.data?.isPower || ["stationary_battery", "battery_rack", "inverter", "solar", "rectifier"].includes(sourceNode?.data.kind as string)
        || ["stationary_battery", "battery_rack", "inverter", "solar", "rectifier"].includes(targetNode?.data.kind as string);

      const customColor = edge.data?.color as string | undefined;
      let tubeColor = isOffline ? 0xb91c1c : (isPower ? 0xeab308 : 0xf97316);
      if (customColor) tubeColor = parseInt(customColor.replace("#", ""), 16);

      const tubeMat = new THREE.MeshStandardMaterial({
        color: tubeColor,
        roughness: 0.8,
        metalness: 0.1,
        emissive: isPower && !isOffline ? tubeColor : 0,
        emissiveIntensity: isPower && !isOffline ? 0.15 : 0,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.userData.edgeId = edge.id;
      scene.add(tube);
      cablesRef.current.push(tube as any);

      if (!isOffline) {
        const pulseMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee })
        );
        pulseMesh.userData.curve = curve;
        scene.add(pulseMesh);
        cablePulsesRef.current.push({ line: tube as any, progress: Math.random(), speed: 0.8 + Math.random() * 0.4, mesh: pulseMesh });
      }
    });
  }, [nodes, edges, sceneVersion, openDoors]);

  const exportGLTF = (asBinary = true) => {
    try {
      const exporter = new GLTFExporter();
      const objectToExport = selectedNode ? threeNodesRef.current.get(selectedNode.id) || sceneRef.current : sceneRef.current;
      if (!objectToExport) { toast.error('Nada para exportar'); return; }
      (exporter as any).parse(
        objectToExport,
        (result: any) => {
          let output: Blob;
          if (asBinary && result instanceof ArrayBuffer) {
            output = new Blob([result], { type: 'application/octet-stream' });
          } else {
            const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            output = new Blob([text], { type: 'application/json' });
          }
          const url = URL.createObjectURL(output);
          const a = document.createElement('a');
          a.href = url;
          const name = selectedNode ? `${(selectedNode.data.name as string) || 'model'}-selected.glb` : `scene-${Date.now()}.glb`;
          a.download = name;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('ExportaÃ§Ã£o concluÃ­da.');
        },
        (error: any) => console.error('GLTF export error:', error),
        { binary: asBinary }
      );
    } catch (err) {
      console.error(err);
      toast.error('Erro ao exportar');
    }
  };

  const loadCustomModelAsync = async (nodeId: string, url: string, fileName: string, kind: "switch" | "camera" | "rack", ports = 8) => {
    try {
      const isGlTF = fileName.toLowerCase().endsWith(".gltf") || fileName.toLowerCase().endsWith(".glb");
      let modelGroup = new THREE.Group();
      if (isGlTF) {
        const gltf = await new GLTFLoader().loadAsync(url);
        modelGroup.add(gltf.scene);
      } else {
        modelGroup.add(await new OBJLoader().loadAsync(url));
      }
      const box = new THREE.Box3().setFromObject(modelGroup);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const targetScale = kind === "switch" ? 4.5 / maxDim : 1.2 / maxDim;
        modelGroup.scale.setScalar(targetScale);
        const center = new THREE.Vector3();
        box.getCenter(center);
        modelGroup.position.sub(center.multiplyScalar(targetScale));
      }
      customModelRegistry.set(url, modelGroup);
      loadingUrlsRef.current.delete(url);
      setSceneVersion((v) => v + 1);
      toast.success("Modelo 3D carregado com sucesso!");
    } catch (e) {
      loadingUrlsRef.current.delete(url);
      toast.error("Erro ao carregar modelo 3D.");
    }
  };

  const handleModelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedNodeId || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    const oldUrl = selectedNode?.data.customModelUrl;
    if (oldUrl && oldUrl !== url) { customModelRegistry.delete(oldUrl); loadingUrlsRef.current.delete(oldUrl); }
    updateNodeData(selectedNodeId, { customModelUrl: url, customModelName: file.name });
    toast.info(`Carregando modelo "${file.name}"...`);
  };

  const addQuickRack = (rackType: "closed" | "open" = "closed") => {
    const id = `rack-${Date.now()}`;
    const count = nodes.filter((n) => n.data.kind === "rack").length;
    const name = rackType === "open" ? `Rack Aberto ${count + 1}` : `Rack Fechado ${count + 1}`;
    addNode({ id, type: "rack", position: { x: 100, y: 100 }, data: { kind: "rack", name, units: 24, rackType, position3d: { x: (count + 1) * 6 - 3, y: 0, z: -2 } } });
    setSelectedNodeId(id);
    toast.success(`${name} adicionado!`);
  };

  const occupiedUs = useMemo(() => {
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

  const isMountedInRack = selectedNode && selectedNode.data.rackId && selectedNode.data.kind !== "rack";
  const rackOfDevice = isMountedInRack ? nodes.find((n) => n.id === selectedNode.data.rackId) : null;
  const devicesInSelectedRack = selectedNode?.data.kind === "rack"
    ? nodes.filter((n) => n.data.rackId === selectedNodeId)
    : [];
  const isRackDoorOpen = selectedNodeId ? openDoors.has(selectedNodeId) : false;

  const resetToIso = () => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (cam && ctrl) {
      ctrl.target.set(0, 2, 0);
      cam.position.set(15, 15, 15);
      cam.zoom = 1;
      cam.updateProjectionMatrix();
      ctrl.update();
      toast.info("Câmera definida para vista Isométrica (ISO)");
    }
  };

  const resetToTop = () => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (cam && ctrl) {
      ctrl.target.set(0, 0, 0);
      cam.position.set(0.01, 25, 0);
      cam.zoom = 1;
      cam.updateProjectionMatrix();
      ctrl.update();
      toast.info("Câmera definida para vista Superior (Topo)");
    }
  };

  const moveCameraUp = () => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (cam && ctrl) {
      cam.position.y += 3;
      ctrl.target.y += 3;
      ctrl.update();
    }
  };

  const moveCameraDown = () => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (cam && ctrl) {
      cam.position.y -= 3;
      ctrl.target.y -= 3;
      ctrl.update();
    }
  };

  const focusOnScene = () => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;

    if (selectedNodeId) {
      const selectedMesh = threeNodesRef.current.get(selectedNodeId);
      if (selectedMesh) {
        const worldPos = new THREE.Vector3();
        selectedMesh.getWorldPosition(worldPos);
        ctrl.target.copy(worldPos);
        cam.position.set(worldPos.x + 8, worldPos.y + 8, worldPos.z + 8);
        cam.zoom = 1.2;
        cam.updateProjectionMatrix();
        ctrl.update();
        toast.info("Câmera focada no equipamento selecionado");
        return;
      }
    }

    // Default focus
    let avgX = 0, avgY = 2, avgZ = 0;
    let count = 0;
    threeNodesRef.current.forEach((mesh) => {
      const pos = new THREE.Vector3();
      mesh.getWorldPosition(pos);
      avgX += pos.x;
      avgY += pos.y;
      avgZ += pos.z;
      count++;
    });

    if (count > 0) {
      avgX /= count;
      avgY /= count;
      avgZ /= count;
    }

    ctrl.target.set(avgX, avgY, avgZ);
    cam.position.set(avgX + 12, avgY + 10, avgZ + 12);
    cam.zoom = 1.0;
    cam.updateProjectionMatrix();
    ctrl.update();
    toast.info("Foco centralizado nos equipamentos");
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border/60 glass">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Câmera Controls Panel */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 pointer-events-auto bg-card/95 backdrop-blur-xl p-2 rounded-xl border border-border/80 shadow-2xl text-card-foreground w-auto animate-fade-in">
        <div className="flex gap-1.5">
          <button
            onClick={resetToIso}
            className="flex items-center justify-center p-2 rounded-lg bg-secondary/80 border border-border/60 hover:bg-secondary transition text-[11px] font-semibold"
            title="Vista Isométrica"
          >
            <Compass className="w-4 h-4 text-cyan-500" />
          </button>

          <button
            onClick={resetToTop}
            className="flex items-center justify-center p-2 rounded-lg bg-secondary/80 border border-border/60 hover:bg-secondary transition text-[11px] font-semibold"
            title="Vista Superior"
          >
            <Eye className="w-4 h-4 text-emerald-500" />
          </button>

          <button
            onClick={moveCameraUp}
            className="flex items-center justify-center p-2 rounded-lg bg-secondary/80 border border-border/60 hover:bg-secondary transition"
            title="Subir Câmera"
          >
            <ChevronUp className="w-4 h-4 text-primary" />
          </button>

          <button
            onClick={moveCameraDown}
            className="flex items-center justify-center p-2 rounded-lg bg-secondary/80 border border-border/60 hover:bg-secondary transition"
            title="Descer Câmera"
          >
            <ChevronDown className="w-4 h-4 text-primary" />
          </button>

          <button
            onClick={focusOnScene}
            className="flex items-center justify-center p-2 rounded-lg bg-primary/10 border border-primary/40 hover:bg-primary/20 transition"
            title="Focar Equipamentos"
          >
            <Layers className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-20 flex flex-wrap gap-2 pointer-events-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-card text-card-foreground border border-border shadow-md hover:bg-secondary transition text-xs font-semibold uppercase tracking-wider"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Voltar para 2D
        </button>
        <button
          onClick={() => addQuickRack("closed")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary/10 text-primary border border-primary/40 shadow-md hover:bg-primary/20 transition text-xs font-semibold uppercase tracking-wider glow-cyan"
        >
          <Plus className="w-3.5 h-3.5" />
          Rack Fechado
        </button>
        <button
          onClick={() => addQuickRack("open")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/40 shadow-md hover:bg-blue-500/20 transition text-xs font-semibold uppercase tracking-wider"
        >
          <Plus className="w-3.5 h-3.5" />
          Rack Aberto
        </button>
        <button
          onClick={() => exportGLTF(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-card text-card-foreground border border-border shadow-md hover:bg-secondary transition text-xs font-semibold uppercase tracking-wider"
          title="Exportar cena 3D (GLB)"
        >
          <Upload className="w-3.5 h-3.5" />
          Exportar 3D
        </button>
        {toggleFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-card text-card-foreground border border-border shadow-md hover:bg-white/10 transition text-xs font-semibold uppercase tracking-wider"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          </button>
        )}
      </div>

      {/* Connect Mode Banner */}
      {connectMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-xl shadow-xl border pointer-events-auto"
          style={{ background: connectPowerMode ? 'rgba(234,179,8,0.15)' : 'rgba(59,130,246,0.15)', borderColor: connectPowerMode ? 'rgba(234,179,8,0.4)' : 'rgba(59,130,246,0.4)' }}
        >
          <span className="text-sm" style={{ color: connectPowerMode ? '#eab308' : '#3b82f6' }}>
            {connectPowerMode ? '⚡' : '📡'}
          </span>
          <div className="text-xs font-semibold" style={{ color: connectPowerMode ? '#eab308' : '#3b82f6' }}>
            {connectSourceId
              ? `Selecione o destino (${connectPowerMode ? 'Energia' : 'Dados'})`
              : `Modo ${connectPowerMode ? 'Energia' : 'Dados'} — clique no 1º equipamento`
            }
          </div>
          <button
            onClick={() => { setConnectMode(false); setConnectPowerMode(false); setConnectSourceId(null); }}
            className="ml-2 text-xs px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition"
          >
            Esc
          </button>
        </div>
      )}

      <div className="absolute top-4 right-4 bottom-4 w-80 z-10 flex flex-col gap-3 pointer-events-none">
        {/* Edge (Cable) Properties Panel */}
        {selectedEdge && !selectedNode && (
          <div className="pointer-events-auto bg-card/95 backdrop-blur-xl rounded-xl border border-border p-4 space-y-4 shadow-xl text-card-foreground">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${selectedEdge.data?.isPower ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {selectedEdge.data?.isPower ? <Zap className="w-4 h-4" /> : <Network className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-semibold">{selectedEdge.data?.isPower ? 'Cabo de Energia' : 'Cabo de Dados'}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {nodes.find(n => n.id === selectedEdge.source)?.data.name || selectedEdge.source}
                    {' → '}
                    {nodes.find(n => n.id === selectedEdge.target)?.data.name || selectedEdge.target}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedEdgeId(null)} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Nome / Etiqueta</label>
                <input type="text" value={edgeLabel} onChange={e => setEdgeLabel(e.target.value)}
                  placeholder="ex: Alimentação UPS"
                  className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all" />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Cor do Cabo</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={edgeColor} onChange={e => setEdgeColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border border-border bg-transparent" />
                  <div className="flex gap-1.5 flex-wrap">
                    {['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#14b8a6', '#ffffff'].map(c => (
                      <button key={c} onClick={() => setEdgeColor(c)}
                        className="w-6 h-6 rounded-full border-2 transition hover:scale-110"
                        style={{ background: c, borderColor: edgeColor === c ? 'white' : 'transparent' }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tipo de Cabo</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateEdge(selectedEdgeId!, { data: { ...selectedEdge.data, isPower: false }, className: 'animated' })}
                    className={`px-2 py-1 rounded text-xs font-semibold border transition ${!selectedEdge.data?.isPower ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-card text-muted-foreground border-border/40 hover:border-blue-500/30'}`}
                  >
                    📡 Dados
                  </button>
                  <button
                    onClick={() => updateEdge(selectedEdgeId!, { data: { ...selectedEdge.data, isPower: true }, className: 'power-cable animated' })}
                    className={`px-2 py-1 rounded text-xs font-semibold border transition ${selectedEdge.data?.isPower ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' : 'bg-card text-muted-foreground border-border/40 hover:border-yellow-500/30'}`}
                  >
                    ⚡ Energia
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border/40">
                <button
                  onClick={() => { removeEdge(selectedEdgeId!); setSelectedEdgeId(null); toast.success('Cabo removido.'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-medium transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir Cabo
                </button>
                <button
                  onClick={() => {
                    updateEdge(selectedEdgeId!, { data: { ...selectedEdge.data, label: edgeLabel, color: edgeColor } });
                    toast.success('Cabo atualizado!');
                    setSelectedEdgeId(null);
                  }}
                  className="flex-2 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:glow-cyan text-xs transition"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedNode ? (
          <div className="flex-1 overflow-y-auto pointer-events-auto bg-card/95 backdrop-blur-xl rounded-xl border border-border p-4 space-y-4 shadow-xl flex flex-col text-card-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${selectedNode.data.kind === "rack" ? "bg-emerald-500/10 text-emerald-500" :
                  selectedNode.data.kind === "switch" ? "bg-cyan-500/10 text-cyan-500" :
                    selectedNode.data.kind === "camera" ? "bg-fuchsia-500/10 text-fuchsia-500" :
                      selectedNode.data.kind === "olt" ? "bg-green-500/10 text-green-500" :
                        selectedNode.data.kind === "dio" ? "bg-indigo-500/10 text-indigo-500" :
                          selectedNode.data.kind === "router" ? "bg-orange-500/10 text-orange-500" :
                            selectedNode.data.kind === "server" ? "bg-blue-500/10 text-blue-500" :
                              "bg-cyan-500/10 text-cyan-500"
                  }`}>
                  {selectedNode.data.kind === "rack" && <HardDrive className="w-4 h-4" />}
                  {selectedNode.data.kind === "switch" && <Network className="w-4 h-4" />}
                  {selectedNode.data.kind === "camera" && <Camera className="w-4 h-4" />}
                  {selectedNode.data.kind === "olt" && <Activity className="w-4 h-4" />}
                  {selectedNode.data.kind === "dio" && <Network className="w-4 h-4" />}
                  {selectedNode.data.kind === "router" && <Router className="w-4 h-4" />}
                  {selectedNode.data.kind === "server" && <Server className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm truncate max-w-[140px]">{selectedNode.data.name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{selectedNode.data.kind}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNodeId(null)} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setConnectMode(true);
                    setConnectPowerMode(false);
                    setConnectSourceId(selectedNodeId);
                    toast.info("Agora clique no equipamento de destino (Dados).");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg text-xs font-semibold border border-blue-500/30 transition"
                >
                  <Network className="w-3.5 h-3.5" />
                  Ligar Dados
                </button>
                <button
                  onClick={() => {
                    setConnectMode(true);
                    setConnectPowerMode(true);
                    setConnectSourceId(selectedNodeId);
                    toast.info("Agora clique no equipamento de destino (Energia).");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-lg text-xs font-semibold border border-yellow-500/30 transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Ligar Energia
                </button>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Nome do Dispositivo</label>
                <input type="text" value={editingName} onChange={(e) => { setEditingName(e.target.value); updateNodeData(selectedNodeId!, { name: e.target.value }); }}
                  className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all" />
              </div>

              {!["wall", "door", "ceiling"].includes(selectedNode.data.kind as string) && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Amperagem (A)</label>
                    <input type="number" step="0.1" value={(selectedNode.data as any).amperage || 0} onChange={(e) => updateNodeData(selectedNodeId!, { amperage: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Potência (W)</label>
                    <input type="number" step="1" value={(selectedNode.data as any).powerWatts || 0} onChange={(e) => updateNodeData(selectedNodeId!, { powerWatts: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all" />
                  </div>
                </div>
              )}

              {selectedNode.data.kind === "camera" && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">EndereÃ§o IP</label>
                  <input type="text" value={editingIp} onChange={(e) => { setEditingIp(e.target.value); updateNodeData(selectedNodeId!, { ip: e.target.value }); }}
                    className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all" />
                </div>
              )}

              {selectedNode.data.kind === "rack" && (
                <>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/60 space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Modelo de Rack</div>
                    <select
                      value={(selectedNode.data as any).rackType || "closed"}
                      onChange={(e) => updateNodeData(selectedNodeId!, { rackType: e.target.value as "closed" | "open" })}
                      className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="closed">Rack Fechado (Gabinete)</option>
                      <option value="open">Rack Aberto (Open Rack)</option>
                    </select>
                    <div className="mt-3">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">Unidades (U)</label>
                      <input
                        type="number"
                        min={1}
                        max={80}
                        className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                        value={(selectedNode.data as any).units || 24}
                        onChange={(e) => updateNodeData(selectedNodeId!, { units: parseInt(e.target.value) || 24 })}
                      />
                    </div>
                  </div>

                  {(selectedNode.data as any).rackType !== "open" && (
                    <div className="p-3 rounded-lg bg-secondary/50 border border-border/60 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-1">
                        <DoorOpen className="w-3.5 h-3.5" />
                        <span>Porta do Rack</span>
                      </div>
                      <button
                        onClick={() => toggleRackDoor(selectedNodeId!)}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition border ${isRackDoorOpen
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                          : "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20"
                          }`}
                      >
                        <DoorOpen className="w-3.5 h-3.5" />
                        {isRackDoorOpen ? "Fechar Porta" : "Abrir Porta"}
                      </button>
                      <p className="text-[10px] text-muted-foreground">
                        {isRackDoorOpen ? "Porta aberta â€” equipamentos acessÃ­veis." : "Clique para abrir e acessar os equipamentos internos."}
                      </p>
                    </div>
                  )}

                  {devicesInSelectedRack.length > 0 && (
                    <div className="p-3 rounded-lg bg-secondary/50 border border-border/60 space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Equipamentos no Rack
                      </div>
                      <div className="space-y-1">
                        {devicesInSelectedRack.map((dev) => (
                          <div key={dev.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-background border border-border/40 text-xs">
                            <div>
                              <span className="font-medium text-foreground">{dev.data.name}</span>
                              <span className="ml-2 text-[10px] text-primary bg-primary/10 border border-primary/20 px-1 py-0.5 rounded font-bold">
                                U{dev.data.rackUnit}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const rackPos = selectedNode.data.position3d || { x: 0, y: 0, z: 0 };
                                updateNodeData(dev.id, {
                                  rackId: undefined,
                                  rackUnit: undefined,
                                  position3d: { x: (rackPos.x ?? 0) + 4 + Math.random() * 2, y: 1, z: (rackPos.z ?? 0) + 4 },
                                });
                                toast.success(`"${dev.data.name}" removido do rack!`);
                              }}
                              className="text-muted-foreground hover:text-amber-500 transition p-1 rounded"
                              title="Retirar do rack"
                            >
                              <ArrowUpFromLine className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {isMountedInRack && rackOfDevice && (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Montado em: {rackOfDevice.data.name} Â· U{selectedNode.data.rackUnit}</span>
                  </div>
                  <button
                    onClick={removeFromRack}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition"
                  >
                    <ArrowUpFromLine className="w-3.5 h-3.5" />
                    Retirar do Rack
                  </button>
                </div>
              )}

              {["switch", "camera", "olt", "dio", "router", "server", "stationary_battery", "inverter", "patchpanel", "dwdm", "rectifier"].includes(selectedNode.data.kind as string) && (
                <div className="p-3 rounded-lg bg-secondary/50 border border-border/60 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Montagem em Rack (19")</span>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Selecionar Cabinet Rack</label>
                    <select
                      value={mountingRackId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMountingRackId(val);
                        if (val === "none") {
                          updateNodeData(selectedNodeId!, { rackId: undefined, rackUnit: undefined });
                        } else {
                          const collidesWith = checkRackCollision(val, mountingU, selectedNodeId!, selectedNode.data.rackUHeight ?? 1);
                          if (collidesWith) { toast.error(`Colisão com "${collidesWith.data.name}"`); return; }
                          updateNodeData(selectedNodeId!, { rackId: val, rackUnit: mountingU, position3d: undefined, rotation3d: undefined });
                        }
                      }}
                      className="w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                    >
                      <option value="none">Nenhum (Solto no espaÃ§o)</option>
                      {racksList.map((rack) => (
                        <option key={rack.id} value={rack.id}>{rack.data.name} ({(rack.data as any).units ?? (rack.data as any).shelves}U)</option>
                      ))}
                    </select>
                  </div>

                  {mountingRackId !== "none" && (
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">PosiÃ§Ã£o Unit (U)</label>
                      <input
                        type="number"
                        min={1}
                        max={((nodes.find((n) => n.id === mountingRackId)?.data as any)?.units ?? (nodes.find((n) => n.id === mountingRackId)?.data as any)?.shelves ?? 24) - (selectedNode.data.rackUHeight ?? 1) + 1}
                        value={mountingU}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setMountingU(val);
                          const collidesWith = checkRackCollision(mountingRackId, val, selectedNodeId!, selectedNode.data.rackUHeight ?? 1);
                          if (collidesWith) { toast.error(`Colisão com "${collidesWith.data.name}"`); return; }
                          updateNodeData(selectedNodeId!, { rackId: mountingRackId, rackUnit: val, position3d: undefined, rotation3d: undefined });
                        }}
                        className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  )}
                </div>
              )}

              {(mountingRackId === "none" || selectedNode.data.kind === "rack" || selectedNode.data.kind === "battery_rack") && (
                <div className="p-3 rounded-lg bg-secondary/50 border border-border/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-1">
                    <Move className="w-3.5 h-3.5" />
                    <span>Posicionamento 3D (X, Y, Z)</span>
                  </div>
                  {[
                    { label: "Eixo X (Horizontal)", value: positionX, setter: setPositionX, min: -20, max: 20 },
                    ...(selectedNode.data.kind !== "rack" ? [{ label: "Eixo Y (Altura)", value: positionY, setter: setPositionY, min: 0.1, max: 10 }] : []),
                    { label: "Eixo Z (Profundidade)", value: positionZ, setter: setPositionZ, min: -20, max: 20 },
                  ].map(({ label, value, setter, min, max }) => (
                    <div key={label}>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>{label}</span>
                        <span className="font-mono text-foreground">{(value as number).toFixed(1)}m</span>
                      </div>
                      <input type="range" min={min} max={max} step={0.5} value={value as number}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          (setter as (v: number) => void)(v);
                          const patch: any = {};
                          if (label.includes("X")) patch.x = v;
                          if (label.includes("Y")) patch.y = v;
                          if (label.includes("Z")) patch.z = v;
                          updateNodeData(selectedNodeId!, { position3d: { ...(selectedNode.data.position3d as any || { x: positionX, y: positionY, z: positionZ }), ...patch } });
                        }}
                        className="w-full accent-cyan-500" />
                    </div>
                  ))}
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span>RotaÃ§Ã£o Y</span>
                      <span className="font-mono text-foreground">{((rotationY * 180) / Math.PI).toFixed(0)}Â°</span>
                    </div>
                    <input type="range" min={-Math.PI} max={Math.PI} step={Math.PI / 12} value={rotationY}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setRotationY(v);
                        updateNodeData(selectedNodeId!, { rotation3d: { ...(selectedNode.data.rotation3d as any || { x: 0, y: rotationY, z: 0 }), y: v } });
                      }}
                      className="w-full accent-cyan-500" />
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-secondary/50 border border-border/60 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar Modelo 3D</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Selecione um arquivo .gltf, .glb ou .obj local para substituir a malha padrÃ£o.</p>
                <label className="flex items-center justify-center gap-2 border border-dashed border-border hover:border-primary rounded-lg p-2 cursor-pointer transition bg-background hover:bg-secondary/80 text-xs font-medium text-foreground">
                  <Upload className="w-4 h-4 text-primary" />
                  <span>{selectedNode.data.customModelName || "Importar Modelo"}</span>
                  <input type="file" accept=".gltf,.glb,.obj" onChange={handleModelFileUpload} className="hidden" />
                </label>
                {selectedNode.data.customModelUrl && (
                  <button
                    onClick={() => updateNodeData(selectedNodeId!, { customModelUrl: undefined, customModelName: undefined })}
                    className="w-full flex items-center justify-center gap-1.5 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg py-1 text-[10px] font-semibold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remover customizado
                  </button>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border/40">
              <button
                onClick={() => { removeNode(selectedNodeId!); setSelectedNodeId(null); toast.success("Dispositivo removido."); }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-medium transition"
              >
                <Trash2 className="w-4 h-4" /> Excluir Dispositivo
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
