import dns from "node:dns/promises";
import { execFile } from "node:child_process";
import net from "node:net";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function pingIp(ip: string, timeout = 800) {
  const platform = process.platform;
  const args = platform === "win32"
    ? ["-n", "1", "-w", String(timeout), ip]
    : ["-c", "1", "-W", "1", ip];

  try {
    const { stdout } = await execFileAsync("ping", args, {
      timeout: timeout + 500,
      windowsHide: true,
    });

    const match = stdout.match(/time[=<]\s*([\d.]+)\s*ms/i);
    const ping = match ? Math.round(Number(match[1])) : timeout;
    return { online: true, ping };
  } catch {
    return { online: false, ping: timeout };
  }
}

const pingCache = new Map<string, { online: boolean; ping: number; expiresAt: number }>();

export async function getCachedPing(ip: string, timeout = 800) {
  const key = `${ip}:${timeout}`;
  const now = Date.now();
  const cached = pingCache.get(key);

  if (cached && cached.expiresAt > now) {
    return { online: cached.online, ping: cached.ping };
  }

  const result = await pingIp(ip, timeout);
  pingCache.set(key, { ...result, expiresAt: Date.now() + 10_000 });
  return result;
}

export async function checkPorts(ip: string, ports: number[] = [80, 443, 554]) {
  const openPorts: number[] = [];

  await Promise.all(
    ports.map((port) =>
      new Promise<void>((resolve) => {
        const socket = new net.Socket();
        const onFinish = () => {
          socket.destroy();
          resolve();
        };

        socket.setTimeout(500);
        socket.once("connect", () => {
          openPorts.push(port);
          onFinish();
        });
        socket.once("timeout", onFinish);
        socket.once("error", onFinish);
        socket.connect(port, ip);
      }),
    ),
  );

  return openPorts;
}

export async function getArpTable() {
  try {
    const args = process.platform === "win32" ? ["-a"] : ["-n"];
    const { stdout } = await execFileAsync("arp", args, {
      timeout: 2000,
      windowsHide: true,
    });

    const table: Record<string, string> = {};
    const lines = stdout.split(/\r?\n/);

    for (const line of lines) {
      if (!line.trim()) continue;

      if (process.platform === "win32") {
        const match = line.match(/\s*(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F-]+)\s+\w+/);
        if (match) {
          table[match[1]] = match[2].replace(/-/g, ":").toUpperCase();
        }
      } else {
        const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+.*\s+([0-9a-fA-F:]{17})\s+/);
        if (match) {
          table[match[1]] = match[2].toUpperCase();
        }
      }
    }

    return table;
  } catch {
    return {};
  }
}

export async function resolveHostname(ip: string) {
  try {
    const names = await dns.reverse(ip);
    return names?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function sweepSubnetArp(subnet: string) {
  const ips = Array.from({ length: 254 }, (_, index) => `${subnet}.${index + 1}`);

  await limitConcurrency(ips, 40, async (ip) => {
    await pingIp(ip, 300);
  });

  return getArpTable();
}

export async function limitConcurrency<T, U>(items: T[], limit: number, fn: (item: T) => Promise<U>) {
  const results = new Array<U>(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (currentIndex < items.length) {
      const index = currentIndex;
      currentIndex += 1;
      results[index] = await fn(items[index]);
    }
  });

  await Promise.all(workers);
  return results;
}
