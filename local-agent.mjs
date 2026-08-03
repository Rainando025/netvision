#!/usr/bin/env node
/**
 * NetVision Local Agent
 * 
 * Execute: node local-agent.mjs
 * 
 * Este agente roda na sua máquina local e expõe uma API HTTP que o site no Vercel
 * usa para realizar varreduras reais de rede local. Isso resolve a limitação de
 * servidores na nuvem não terem acesso a redes privadas (192.168.x.x).
 */

import { createServer } from "http";
import { exec } from "child_process";
import net from "net";
import dns from "dns/promises";
import os from "os";

const PORT = 7891;
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "https://network-vision-hub.vercel.app",
];

// ---------- Scanning utilities (copied from network-scanner.server.ts) ----------

function pingIp(ip, timeoutMs = 800) {
  return new Promise((resolve) => {
    const start = Date.now();
    exec(`ping -n 1 -w ${timeoutMs} ${ip}`, { timeout: timeoutMs + 500 }, (error, stdout) => {
      const duration = Date.now() - start;
      const stdoutStr = stdout ? stdout.toString() : "";
      const isOnline =
        (stdoutStr.includes("ms") || stdoutStr.includes("TTL=")) &&
        !stdoutStr.includes("inacess") &&
        !stdoutStr.includes("Esgotado") &&
        !stdoutStr.includes("timed out");
      if (isOnline) {
        const match = stdoutStr.match(/(?:time|tempo)[=<]([\d.]+)\s*ms/i);
        const pingVal = match ? Math.round(parseFloat(match[1])) : Math.max(1, duration);
        resolve({ online: true, ping: pingVal });
      } else {
        resolve({ online: false, ping: 0 });
      }
    });
  });
}

const pingCache = new Map();

function getCachedPing(ip, timeoutMs = 800) {
  const cached = pingCache.get(ip);
  const now = Date.now();
  if (cached && now - cached.timestamp < 2500) {
    return Promise.resolve({ online: cached.online, ping: cached.ping });
  }
  return pingIp(ip, timeoutMs).then((res) => {
    pingCache.set(ip, { ...res, timestamp: Date.now() });
    return res;
  });
}

function checkPorts(ip, ports = [80, 443, 554, 8000, 22]) {
  const openPorts = [];
  const promises = ports.map((port) => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(250);
      socket.on("connect", () => { openPorts.push(port); socket.destroy(); resolve(); });
      socket.on("timeout", () => { socket.destroy(); resolve(); });
      socket.on("error", () => { socket.destroy(); resolve(); });
      socket.connect(port, ip);
    });
  });
  return Promise.all(promises).then(() => openPorts);
}

async function resolveHostname(ip) {
  try {
    const dnsPromise = dns.reverse(ip).then((h) => h[0] || "");
    const timeout = new Promise((r) => setTimeout(() => r(""), 150));
    const dnsName = await Promise.race([dnsPromise, timeout]);
    if (dnsName) return dnsName;
  } catch {
    // Ignore DNS error and try fallback
  }

  // Fallback to ping -a on Windows
  if (process.platform === "win32") {
    try {
      return await new Promise((resolve) => {
        exec(`ping -a -n 1 -w 400 ${ip}`, { timeout: 1000 }, (error, stdout) => {
          if (stdout) {
            const stdoutStr = stdout.toString();
            const match = stdoutStr.match(/([a-zA-Z0-9\-_.]+)\s+\[\s*([0-9.]+)\s*\]/);
            if (match && match[1] && match[1] !== ip) {
              resolve(match[1]);
              return;
            }
          }
          resolve("");
        });
      });
    } catch {
      // ignore
    }
  }

  return "";
}

function getArpTable() {
  return new Promise((resolve) => {
    exec("arp -a", (error, stdout) => {
      const map = {};
      if (error || !stdout) { resolve(map); return; }
      const lines = stdout.toString().split("\n");
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const ip = parts[0];
          const macMatch = parts[1].match(/([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}/);
          if (macMatch) map[ip] = macMatch[0].replace(/-/g, ":").toUpperCase();
        }
      }
      resolve(map);
    });
  });
}

async function sweepSubnetArp(subnet) {
  const promises = [];
  for (let i = 1; i <= 254; i++) {
    const ip = `${subnet}.${i}`;
    promises.push(new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(250);
      const done = () => { socket.destroy(); resolve(); };
      socket.on("connect", done).on("timeout", done).on("error", done);
      socket.connect(80, ip);
    }));
  }
  await Promise.all(promises);
  return await getArpTable();
}

async function limitConcurrency(items, limit, fn) {
  const results = [];
  let index = 0;
  async function run() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }
  const workers = [];
  for (let i = 0; i < Math.min(limit, items.length); i++) workers.push(run());
  await Promise.all(workers);
  return results;
}

const VENDOR_OUI = {
  "BC:AD:28": "Hikvision", "44:19:B6": "Hikvision",
  "00:12:41": "Axis Communications", "AC:CC:8E": "Axis Communications",
  "3C:EF:8C": "Dahua", "4C:11:BF": "Dahua",
  "B8:27:EB": "Raspberry Pi", "DC:A6:32": "Raspberry Pi",
  "F4:F5:E8": "Google", "00:1A:79": "Cisco",
  "00:0C:29": "VMware", "00:50:56": "VMware",
  "E0:CB:1D": "Intelbras", "18:0D:2C": "Intelbras", "24:FD:0D": "Intelbras",
  "48:A9:8A": "MikroTik", "B0:0C:D1": "HP",
  "B0:F2:F6": "Samsung", "00:1B:21": "Intel",
  "F0:9F:C2": "Ubiquiti", "FC:EC:DA": "Ubiquiti",
};
const DEVICE_BY_VENDOR = {
  Hikvision: "Câmera IP", Dahua: "Câmera IP",
  "Axis Communications": "Câmera IP", Intelbras: "Câmera IP",
  Ubiquiti: "Access Point", Cisco: "Switch / Router",
  MikroTik: "Switch / Router", "Raspberry Pi": "SBC / NVR",
  Google: "Smart Device", VMware: "Máquina Virtual",
  Intel: "PC / Servidor", HP: "PC / Servidor", Samsung: "Smart Device",
};

function recognizeFromMac(mac, ports = []) {
  const oui = mac.slice(0, 8).toUpperCase();
  let vendor = VENDOR_OUI[oui] ?? "Desconhecido";
  let deviceType = DEVICE_BY_VENDOR[vendor] ?? "Desconhecido";
  if (deviceType === "Desconhecido") {
    if (ports.includes(554)) { deviceType = "Câmera IP"; if (vendor === "Desconhecido") vendor = "Câmera Genérica"; }
    else if (ports.includes(22) && (ports.includes(80) || ports.includes(443))) deviceType = "Switch / Router";
    else if (ports.includes(3389) || ports.includes(445)) deviceType = "PC / Servidor";
    else if (ports.includes(8080) && ports.includes(22)) deviceType = "SBC / NVR";
    else if (ports.includes(80) || ports.includes(443)) deviceType = "PC / Servidor";
  }
  return { vendor, deviceType };
}

function getLocalSubnet() {
  const interfaces = os.networkInterfaces();
  for (const addrs of Object.values(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        const parts = addr.address.split(".");
        return { subnet: parts.slice(0, 3).join("."), localIp: addr.address };
      }
    }
  }
  return { subnet: "192.168.1", localIp: "" };
}

// ---------- HTTP handlers ----------

async function handleArpDevices(subnet) {
  const arpTable = await sweepSubnetArp(subnet);
  const subnetIps = Object.entries(arpTable)
    .filter(([ip]) => ip.startsWith(subnet + ".") && !ip.endsWith(".255"))
    .filter(([, mac]) => mac !== "FF:FF:FF:FF:FF:FF" && mac !== "00:00:00:00:00:00")
    .map(([ip, mac]) => ({ ip, mac }));

  const devices = [];
  await limitConcurrency(subnetIps, 6, async ({ ip, mac }) => {
    const openPorts = await checkPorts(ip);
    const pingResult = await getCachedPing(ip, 800);
    const online = pingResult.online || openPorts.length > 0;
    const pingVal = pingResult.online ? pingResult.ping : (openPorts.length > 0 ? 8 : 5);
    const { vendor, deviceType } = recognizeFromMac(mac, openPorts);
    const hostname = await resolveHostname(ip) || `${deviceType.toLowerCase().split(" ")[0]}-${ip.split(".").pop()}.local`;
    devices.push({
      ip, mac, hostname, vendor, deviceType,
      status: online ? (pingVal > 80 ? "warning" : "online") : "warning",
      ping: pingVal, ports: openPorts,
    });
  });

  return devices.sort((a, b) => parseInt(a.ip.split(".")[3] || "0") - parseInt(b.ip.split(".")[3] || "0"));
}

async function handleScanBatch(ips) {
  const pingResults = await limitConcurrency(ips, 10, async (ip) => {
    const openPorts = await checkPorts(ip);
    let online = openPorts.length > 0;
    let pingVal = online ? 8 : 0;
    if (!online) { const res = await getCachedPing(ip, 800); online = res.online; pingVal = res.ping; }
    return { ip, online, ping: pingVal, openPorts };
  });

  const arpTable = await getArpTable();
  const activeDevices = [];
  for (const p of pingResults) {
    const mac = arpTable[p.ip];
    const hasArp = !!mac && mac !== "FF:FF:FF:FF:FF:FF" && mac !== "00:00:00:00:00:00";
    if (p.online || hasArp) {
      const pingVal = p.online ? p.ping : 5;
      const macAddress = mac || "00:00:00:00:00:00";
      const { vendor, deviceType } = recognizeFromMac(macAddress, p.openPorts);
      const hostname = await resolveHostname(p.ip) || `${deviceType.toLowerCase().split(" ")[0]}-${p.ip.split(".").pop()}.local`;
      activeDevices.push({
        ip: p.ip, mac: macAddress, hostname, vendor, deviceType,
        status: pingVal > 80 ? "warning" : "online",
        ping: pingVal, ports: p.openPorts,
      });
    }
  }
  return activeDevices;
}

async function handlePing(ip) {
  const openPorts = await checkPorts(ip, [80, 443, 554]);
  if (openPorts.length > 0) return { online: true, ping: 8, status: "online" };
  const res = await getCachedPing(ip, 800);
  let online = res.online, pingVal = res.ping;
  if (!online) { const arp = await getArpTable(); if (arp[ip]) { online = true; pingVal = 6; } }
  return { online, ping: pingVal, status: !online ? "offline" : pingVal > 80 ? "warning" : "online" };
}

// ---------- HTTP server ----------

function cors(req, res) {
  const origin = req.headers.origin || "";
  const allowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.") ||
    origin.endsWith(".vercel.app") ||
    origin.startsWith("https://network-vision-hub");
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

function json(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => body += chunk);
    req.on("end", () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error("Invalid JSON")); } });
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  cors(req, res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url = req.url || "/";
  const time = () => new Date().toLocaleTimeString();

  try {
    if (req.method === "GET" && url === "/health") {
      return json(res, { ok: true, version: "1.0.0", agent: "NetVision Local Agent" });
    }

    if (req.method === "GET" && url === "/subnet") {
      const subnetData = getLocalSubnet();
      console.log(`[${time()}] [CMD] Solicitada detecção de subnet. Retornado: ${subnetData.subnet}.0/24 (IP: ${subnetData.localIp})`);
      return json(res, subnetData);
    }

    if (req.method === "POST" && url === "/arp-devices") {
      const { subnet } = await readBody(req);
      if (!subnet) return json(res, { error: "subnet required" }, 400);
      console.log(`[${time()}] [CMD] Iniciando varredura ARP na subnet ${subnet}.0/24...`);
      const devices = await handleArpDevices(subnet);
      console.log(`[${time()}] [CMD] Varredura ARP concluída: ${devices.length} dispositivos encontrados.`);
      return json(res, devices);
    }

    if (req.method === "POST" && url === "/scan-batch") {
      const { ips } = await readBody(req);
      if (!Array.isArray(ips)) return json(res, { error: "ips array required" }, 400);
      console.log(`[${time()}] [CMD] Iniciando varredura de ping/portas em lote de ${ips.length} IPs (${ips[0]} a ${ips[ips.length - 1]})...`);
      const devices = await handleScanBatch(ips);
      if (devices.length > 0) {
        console.log(`[${time()}] [CMD] Lote concluído: ${devices.length} dispositivo(s) respondendo: ${devices.map(d => `${d.ip} (${d.hostname})`).join(", ")}`);
      }
      return json(res, devices);
    }

    if (req.method === "POST" && url === "/ping") {
      const { ip } = await readBody(req);
      if (!ip) return json(res, { error: "ip required" }, 400);
      console.log(`[${time()}] [CMD] Executando ping individual em ${ip}...`);
      const result = await handlePing(ip);
      console.log(`[${time()}] [CMD] Resultado do ping para ${ip}: ${result.status} (${result.ping}ms)`);
      return json(res, result);
    }

    json(res, { error: "Not found" }, 404);
  } catch (err) {
    console.error("[agent error]", err);
    json(res, { error: String(err) }, 500);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║         NetVision Local Agent  v1.0.0                ║");
  console.log("╠═══════════════════════════════════════════════════════╣");
  console.log(`║  Escutando em http://127.0.0.1:${PORT}              ║`);
  console.log("║                                                       ║");
  console.log("║  Abra o site no Vercel e o scanner usará sua rede!   ║");
  console.log("║  Pressione Ctrl+C para parar o agente.               ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log("");

  const info = getLocalSubnet();
  console.log(`  Subnet detectada: ${info.subnet}.0/24`);
  console.log(`  IP local:         ${info.localIp}`);
  console.log("");
});
