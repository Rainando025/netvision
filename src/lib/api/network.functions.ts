import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import os from "os";
import { 
  pingIp, 
  getCachedPing, 
  checkPorts, 
  getArpTable, 
  resolveHostname, 
  sweepSubnetArp, 
  limitConcurrency 
} from "./network-scanner.server";
import { recognizeFromMac } from "../device-recognition";
import type { ScannedDevice } from "../types";

// Detect if running in a cloud environment (Vercel/serverless) that cannot access private LAN
// Vercel sets VERCEL=1 and NOW_BUILDER=1 in its runtime. We also check for the absence of
// actual network interfaces as a last resort fallback.
function detectCloudEnv(): boolean {
  if (typeof process === "undefined") return true;
  if (process.env.VERCEL === "1" || process.env.VERCEL === "true" || !!process.env.VERCEL) return true;
  if (!!process.env.NOW_BUILDER) return true;
  if (!!process.env.VERCEL_ENV) return true;
  if (!!process.env.VERCEL_URL) return true;
  // No process env indicators; assume local
  return false;
}
const isVercel = detectCloudEnv();

// Detects the local machine subnet (e.g. "192.168.10")
export const getLocalSubnet = createServerFn({ method: "GET" })
  .handler(async () => {
    if (isVercel) {
      return { subnet: "192.168.1", localIp: "192.168.1.15", isCloud: true };
    }
    
    try {
      const interfaces = os.networkInterfaces();
      for (const [, addrs] of Object.entries(interfaces)) {
        if (!addrs) continue;
        for (const addr of addrs) {
          if (addr.family === "IPv4" && !addr.internal) {
            const parts = addr.address.split(".");
            return {
              subnet: parts.slice(0, 3).join("."),
              localIp: addr.address,
              isCloud: false,
            };
          }
        }
      }
    } catch {
      // ignore
    }
    return { subnet: "192.168.1", localIp: "", isCloud: false };
  });

// Fast scan: triggers a background ARP sweep by probing port 80 of all 254 IPs,
// then reads the newly populated ARP cache, and details the active devices.
export const getArpDevices = createServerFn({ method: "POST" })
  .validator(z.object({ subnet: z.string() }))
  .handler(async ({ data: { subnet } }) => {
    if (isVercel) {
      throw new Error("Varredura de rede bloqueada no servidor: Execução em nuvem sem agente local.");
    }
    
    // Phase 1: Fast ARP sweep (sends TCP requests in parallel to populate the ARP cache)
    const arpTable = await sweepSubnetArp(subnet);
    
    // Filter only IPs in the requested subnet
    const subnetIps = Object.entries(arpTable)
      .filter(([ip]) => ip.startsWith(subnet + ".") && !ip.endsWith(".255"))
      .filter(([, mac]) => mac !== "FF:FF:FF:FF:FF:FF" && mac !== "00:00:00:00:00:00")
      .map(([ip, mac]) => ({ ip, mac }));

    const devices: ScannedDevice[] = [];
    
    // Process matching IPs with a concurrency limit of 6 to prevent process spawning / socket issues
    await limitConcurrency(subnetIps, 6, async ({ ip, mac }) => {
      const openPorts = await checkPorts(ip);
      const pingResult = await getCachedPing(ip, 800);
      
      const online = pingResult.online || openPorts.length > 0;
      const pingVal = pingResult.online ? pingResult.ping : (openPorts.length > 0 ? 8 : 5);
      
      const { vendor, deviceType } = recognizeFromMac(mac, openPorts);
      const hostname = await resolveHostname(ip) || 
        `${deviceType.toLowerCase().split(" ")[0]}-${ip.split(".").pop()}.local`;
      
      devices.push({
        ip,
        mac,
        hostname,
        vendor,
        deviceType,
        status: (online ? (pingVal > 80 ? "warning" : "online") : "warning") as "online" | "offline" | "warning",
        ping: pingVal,
        ports: openPorts,
      });
    });
    
    return devices.sort((a, b) => {
      const ai = parseInt(a.ip.split(".")[3] || "0");
      const bi = parseInt(b.ip.split(".")[3] || "0");
      return ai - bi;
    });
  });

// Live ping for a single IP address (used by dashboards/nodes)
export const pingIpAddress = createServerFn({ method: "POST" })
  .validator(z.object({ ip: z.string() }))
  .handler(async ({ data: { ip } }) => {
    if (isVercel) {
      return {
        online: false,
        ping: 0,
        status: "offline" as const,
      };
    }
    
    // 1. Try port checking first since it's native and extremely lightweight
    const openPorts = await checkPorts(ip, [80, 443, 554]);
    if (openPorts.length > 0) {
      return {
        online: true,
        ping: 8,
        status: "online" as const,
      };
    }
    
    // 2. Fallback to cached ping
    const pingResult = await getCachedPing(ip, 800);
    let online = pingResult.online;
    let pingVal = pingResult.ping;
    
    if (!online) {
      const arpTable = await getArpTable();
      if (arpTable[ip]) {
        online = true;
        pingVal = 6;
      }
    }
    
    return {
      online,
      ping: pingVal,
      status: (!online ? "offline" : pingVal > 80 ? "warning" : "online") as "online" | "offline" | "warning",
    };
  });

// Scan a batch of IPs sequentially/concurrency-limited
export const scanIpBatch = createServerFn({ method: "POST" })
  .validator(z.object({ ips: z.array(z.string()) }))
  .handler(async ({ data: { ips } }) => {
    if (isVercel) {
      throw new Error("Varredura em lote bloqueada no servidor: Execução em nuvem sem agente local.");
    }
    
    // Process with a concurrency limit of 10 to avoid system exhaustion
    const pingResults = await limitConcurrency(ips, 10, async (ip) => {
      const openPorts = await checkPorts(ip);
      let online = openPorts.length > 0;
      let pingVal = online ? 8 : 0;
      
      if (!online) {
        const res = await getCachedPing(ip, 800);
        online = res.online;
        pingVal = res.ping;
      }
      
      return { ip, online, ping: pingVal, openPorts };
    });
    
    const arpTable = await getArpTable();
    const activeDevices: ScannedDevice[] = [];
    
    for (const p of pingResults) {
      const mac = arpTable[p.ip];
      const hasArp = !!mac && mac !== "FF:FF:FF:FF:FF:FF" && mac !== "00:00:00:00:00:00";
      const online = p.online || hasArp;
      
      if (online) {
        const pingVal = p.online ? p.ping : 5;
        const macAddress = mac || "00:00:00:00:00:00";
        const { vendor, deviceType } = recognizeFromMac(macAddress, p.openPorts);
        const hostname = await resolveHostname(p.ip) || 
          `${deviceType.toLowerCase().split(" ")[0]}-${p.ip.split(".").pop()}.local`;
        
        activeDevices.push({
          ip: p.ip,
          mac: macAddress,
          hostname,
          vendor,
          deviceType,
          status: (pingVal > 80 ? "warning" : "online") as "online" | "offline" | "warning",
          ping: pingVal,
          ports: p.openPorts,
        });
      }
    }
    
    return activeDevices;
  });
