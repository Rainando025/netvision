// Simulated device recognition by IP / MAC OUI patterns.

const VENDOR_OUI: Record<string, string> = {
  "BC:AD:28": "Hikvision",
  "44:19:B6": "Hikvision",
  "00:12:41": "Axis Communications",
  "AC:CC:8E": "Axis Communications",
  "3C:EF:8C": "Dahua",
  "4C:11:BF": "Dahua",
  "B8:27:EB": "Raspberry Pi",
  "F4:F5:E8": "Google",
  "00:1A:79": "Cisco",
  "00:0C:29": "VMware",
  "DC:A6:32": "Raspberry Pi",
  "00:50:56": "VMware",
  "E0:CB:1D": "Intelbras",
  "18:0D:2C": "Intelbras",
  "24:FD:0D": "Intelbras",
  "48:A9:8A": "MikroTik",
  "B0:0C:D1": "HP",
  "B0:F2:F6": "Samsung",
  "00:1B:21": "Intel",
  "F0:9F:C2": "Ubiquiti",
  "FC:EC:DA": "Ubiquiti",
};

const DEVICE_BY_VENDOR: Record<string, string> = {
  Hikvision: "Câmera IP",
  Dahua: "Câmera IP",
  "Axis Communications": "Câmera IP",
  Intelbras: "Câmera IP",
  Ubiquiti: "Access Point",
  Cisco: "Switch / Router",
  MikroTik: "Switch / Router",
  "Raspberry Pi": "SBC / NVR",
  Google: "Smart Device",
  VMware: "Máquina Virtual",
  Intel: "PC / Servidor",
  HP: "PC / Servidor",
  Samsung: "Smart Device",
};

const ICON_BY_TYPE: Record<string, string> = {
  "Câmera IP": "camera",
  "Access Point": "wifi",
  "Switch / Router": "network",
  "SBC / NVR": "hard-drive",
  "Smart Device": "smartphone",
  "Máquina Virtual": "server",
  "PC / Servidor": "monitor",
  Desconhecido: "help-circle",
};

function randomMac(): string {
  const keys = Object.keys(VENDOR_OUI);
  const oui = keys[Math.floor(Math.random() * keys.length)];
  const tail = Array.from({ length: 3 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()
  ).join(":");
  return `${oui}:${tail}`;
}

export function recognizeFromMac(mac: string, ports: number[] = []) {
  const oui = mac.slice(0, 8).toUpperCase();
  let vendor = VENDOR_OUI[oui] ?? "Desconhecido";
  let deviceType = DEVICE_BY_VENDOR[vendor] ?? "Desconhecido";
  
  if (deviceType === "Desconhecido") {
    if (ports.includes(554)) {
      deviceType = "Câmera IP";
      if (vendor === "Desconhecido") vendor = "Câmera Genérica";
    } else if (ports.includes(22) && (ports.includes(80) || ports.includes(443))) {
      deviceType = "Switch / Router";
    } else if (ports.includes(3389) || ports.includes(445)) {
      deviceType = "PC / Servidor";
    } else if (ports.includes(8080) && ports.includes(22)) {
      deviceType = "SBC / NVR";
    } else if (ports.includes(80) || ports.includes(443)) {
      deviceType = "PC / Servidor";
    }
  }

  return { vendor, deviceType, icon: ICON_BY_TYPE[deviceType] ?? "help-circle" };
}

function hostnameFor(deviceType: string, ip: string): string {
  const slug = deviceType.toLowerCase().split(" ")[0].replace(/[^a-z]/g, "");
  const last = ip.split(".").pop() ?? "0";
  return `${slug}-${last}.local`;
}

const COMMON_PORTS: Record<string, number[]> = {
  "Câmera IP": [80, 554, 8000],
  "Access Point": [22, 80, 443],
  "Switch / Router": [22, 23, 80, 443],
  "SBC / NVR": [22, 80, 8080],
  "Smart Device": [80, 8008],
  "Máquina Virtual": [22, 3389],
  "PC / Servidor": [22, 445, 3389],
  Desconhecido: [80],
};

export interface SimDevice {
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  deviceType: string;
  status: "online" | "offline" | "warning";
  ping: number;
  ports: number[];
}

export function generateNetworkScan(subnet = "192.168.1", count = 14): SimDevice[] {
  const used = new Set<number>([1]); // gateway
  const devices: SimDevice[] = [
    {
      ip: `${subnet}.1`,
      mac: "F0:9F:C2:11:22:33",
      hostname: "gateway.local",
      vendor: "Ubiquiti",
      deviceType: "Switch / Router",
      status: "online",
      ping: 1,
      ports: [22, 80, 443],
    },
  ];
  while (devices.length < count) {
    const host = 2 + Math.floor(Math.random() * 250);
    if (used.has(host)) continue;
    used.add(host);
    const ip = `${subnet}.${host}`;
    const mac = randomMac();
    const { vendor, deviceType } = recognizeFromMac(mac);
    const r = Math.random();
    const status: SimDevice["status"] = r > 0.9 ? "offline" : r > 0.8 ? "warning" : "online";
    devices.push({
      ip,
      mac,
      hostname: hostnameFor(deviceType, ip),
      vendor,
      deviceType,
      status,
      ping: status === "offline" ? 0 : Math.round((status === "warning" ? 80 : 2) + Math.random() * 40),
      ports: COMMON_PORTS[deviceType] ?? [80],
    });
  }
  return devices.sort((a, b) => {
    const ai = parseInt(a.ip.split(".")[3]);
    const bi = parseInt(b.ip.split(".")[3]);
    return ai - bi;
  });
}

// Stable simulated ping derived from IP — varies a bit each call
export function simulatePing(ip: string): { ping: number; status: "online" | "offline" | "warning" } {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return { ping: 0, status: "offline" };
  const seed = ip.split(".").reduce((a, p) => a + parseInt(p || "0"), 0);
  const offline = seed % 17 === 0;
  if (offline) return { ping: 0, status: "offline" };
  const base = (seed % 30) + 2;
  const jitter = Math.round(Math.random() * 12);
  const ping = base + jitter;
  return { ping, status: ping > 80 ? "warning" : "online" };
}
