import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Network, Camera, HardDrive, BrickWall, DoorClosed, Lightbulb, Box, ChevronDown, Building2, Activity, Router, Server, Battery, Zap, Sun, GripHorizontal } from "lucide-react";
import type { CameraType, SwitchType } from "@/lib/types";
import { useDiagram } from "@/lib/store";

const SWITCH_TYPES: SwitchType[] = ["Gerenciável L2", "Gerenciável L3", "PoE", "Não Gerenciável"];
const CAMERA_TYPES: CameraType[] = ["Dome", "Bullet", "PTZ", "Fisheye", "Box"];

type DialogKind = "switch" | "camera" | "rack" | "wall" | "door" | "lamp" | "ceiling" | "floor" | "olt" | "dio" | "router" | "server" | "battery_rack" | "stationary_battery" | "inverter" | "solar" | "patchpanel" | "dwdm" | "rectifier" | "eci";

export function AddDeviceMenu() {
  const [open, setOpen] = useState<null | DialogKind>(null);
  const [showEnv, setShowEnv] = useState(false);
  const [showIsp, setShowIsp] = useState(false);
  const [showEnergy, setShowEnergy] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      {/* Network devices row */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setOpen("switch")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md glass hover:glow-cyan transition text-xs font-medium">
          <Network className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          Switch
        </button>
        <button onClick={() => setOpen("camera")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md glass hover:glow-accent transition text-xs font-medium">
          <Camera className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" />
          Câmera
        </button>
        <button onClick={() => setOpen("rack")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md glass hover:glow-cyan transition text-xs font-medium border border-primary/20">
          <HardDrive className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          Rack
        </button>
        <button onClick={() => setShowIsp((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md glass transition text-xs font-medium border border-border/40 ${showIsp ? "bg-secondary/60" : ""}`}>
          <Network className="w-4 h-4 text-indigo-400" />
          Provedor ISP
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showIsp ? "rotate-180" : ""}`} />
        </button>
        <button onClick={() => setShowEnv((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md glass transition text-xs font-medium border border-border/40 ${showEnv ? "bg-secondary/60" : ""}`}>
          <Building2 className="w-4 h-4 text-slate-400" />
          Ambiente
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showEnv ? "rotate-180" : ""}`} />
        </button>
        <button onClick={() => setShowEnergy((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md glass transition text-xs font-medium border border-border/40 ${showEnergy ? "bg-secondary/60" : ""}`}>
          <Zap className="w-4 h-4 text-yellow-500" />
          Energia & Infra
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showEnergy ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* ISP elements row */}
      <AnimatePresence>
        {showIsp && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap gap-2"
          >
            <button onClick={() => setOpen("olt")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Activity className="w-3.5 h-3.5 text-green-500" />
              OLT GPON
            </button>
            <button onClick={() => setOpen("dio")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Network className="w-3.5 h-3.5 text-indigo-500" />
              DIO Óptico
            </button>
            <button onClick={() => setOpen("router")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Router className="w-3.5 h-3.5 text-orange-500" />
              Router Core
            </button>
            <button onClick={() => setOpen("server")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Server className="w-3.5 h-3.5 text-blue-500" />
              Servidor
            </button>
            <button onClick={() => setOpen("patchpanel")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
              Patch Panel
            </button>
            <button onClick={() => setOpen("dwdm")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              DWDM
            </button>
            <button onClick={() => setOpen("eci")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              ECI
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Environment elements row */}
      <AnimatePresence>
        {showEnv && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap gap-2"
          >
            <button onClick={() => setOpen("wall")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <BrickWall className="w-3.5 h-3.5 text-slate-400" />
              Parede
            </button>
            <button onClick={() => setOpen("door")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <DoorClosed className="w-3.5 h-3.5 text-amber-500" />
              Porta
            </button>
            <button onClick={() => setOpen("lamp")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
              Lâmpada
            </button>
            <button onClick={() => setOpen("ceiling")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Box className="w-3.5 h-3.5 text-slate-400" />
              Teto
            </button>
            <button onClick={() => setOpen("floor")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Box className="w-3.5 h-3.5 text-slate-500" />
              Chão
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Energy elements row */}
      <AnimatePresence>
        {showEnergy && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap gap-2"
          >
            <button onClick={() => setOpen("battery_rack")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <HardDrive className="w-3.5 h-3.5 text-yellow-500" />
              Rack Baterias
            </button>
            <button onClick={() => setOpen("stationary_battery")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Battery className="w-3.5 h-3.5 text-yellow-400" />
              Bateria Estac.
            </button>
            <button onClick={() => setOpen("inverter")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Zap className="w-3.5 h-3.5 text-teal-500" />
              Inversor / UPS
            </button>
            <button onClick={() => setOpen("solar")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Sun className="w-3.5 h-3.5 text-orange-500" />
              Painel Solar
            </button>
            <button onClick={() => setOpen("rectifier")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:bg-secondary/60 transition text-xs font-medium border border-border/30">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              Retificadora
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && <DeviceDialog kind={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </div>
  );
}

function DeviceDialog({ kind, onClose }: { kind: DialogKind; onClose: () => void }) {
  const addNode = useDiagram((s) => s.addNode);
  const nodes = useDiagram((s) => s.nodes);

  const defaultNames: Record<DialogKind, string> = {
    switch: "Switch Core",
    camera: "Câmera Entrada",
    rack: "Rack Principal",
    wall: "Parede Norte",
    door: "Porta Entrada",
    lamp: "Lâmpada 1",
    ceiling: "Teto Principal",
    floor: "Piso / Chão",
    olt: "OLT Huawei MA5800",
    dio: "DIO 24F",
    router: "Router Borda",
    server: "Servidor Proxmox",
    battery_rack: "Rack de Baterias",
    stationary_battery: "Bateria 12V/100Ah",
    inverter: "Inversor / UPS",
    solar: "Painel Solar 550W",
    patchpanel: "Patch Panel 24P",
    dwdm: "OptiX OSN 9800",
    rectifier: "Retificadora DC",
    eci: "ECI 9603",
  };

  const [name, setName] = useState(defaultNames[kind]);
  const [switchType, setSwitchType] = useState<SwitchType>("PoE");
  const [ports, setPorts] = useState(8);
  const [cameraType, setCameraType] = useState<CameraType>("Dome");
  const [ip, setIp] = useState("192.168.1.10");
  const [units, setUnits] = useState(24);
  const [rackType, setRackType] = useState<"closed" | "open">("closed");
  const [wallWidth, setWallWidth] = useState(10);
  const [lampColor, setLampColor] = useState("#fffbe8");
  const [lampIntensity, setLampIntensity] = useState(2);
  const [powerWatts, setPowerWatts] = useState(0);
  const [amperage, setAmperage] = useState(0);
  
  // ISP State
  const [ponPorts, setPonPorts] = useState(8);
  const [uplinkPorts, setUplinkPorts] = useState(4);
  const [dioPorts, setDioPorts] = useState(24);
  const [connectorType, setConnectorType] = useState<"SC/APC" | "SC/UPC" | "LC">("SC/APC");
  const [routerIfaces, setRouterIfaces] = useState(12);
  const [diskCount, setDiskCount] = useState(4);
  
  // Energy State
  const [batterySlots, setBatterySlots] = useState(4);
  const [batteryModel, setBatteryModel] = useState<string>("12V-100Ah");
  const [inverterPower, setInverterPower] = useState(3000);
  const [solarPower, setSolarPower] = useState(550);
  const [patchpanelPorts, setPatchpanelPorts] = useState(24);
  const [rectifierModules, setRectifierModules] = useState(3);

  // DIO U height based on port count
  const dioUHeight = dioPorts <= 24 ? 1 : dioPorts <= 48 ? 2 : 3;

  const BATTERY_MODELS = [
    { id: "12V-40Ah",  label: "12V / 40Ah  (pequena)",  voltage: 12, capacityAh: 40 },
    { id: "12V-75Ah",  label: "12V / 75Ah",             voltage: 12, capacityAh: 75 },
    { id: "12V-100Ah", label: "12V / 100Ah (padrão)",   voltage: 12, capacityAh: 100 },
    { id: "12V-150Ah", label: "12V / 150Ah",            voltage: 12, capacityAh: 150 },
    { id: "12V-200Ah", label: "12V / 200Ah (grande)",   voltage: 12, capacityAh: 200 },
    { id: "24V-100Ah", label: "24V / 100Ah",            voltage: 24, capacityAh: 100 },
    { id: "48V-50Ah",  label: "48V / 50Ah  (Telecom)",  voltage: 48, capacityAh: 50 },
    { id: "48V-100Ah", label: "48V / 100Ah (Telecom)",  voltage: 48, capacityAh: 100 },
    { id: "48V-100Ah-Li", label: "48V / 100Ah (Lítio Rack 3U)", voltage: 48, capacityAh: 100, isLithium: true },
    { id: "48V-200Ah-Li", label: "48V / 200Ah (Lítio Rack 3U)", voltage: 48, capacityAh: 200, isLithium: true },
  ];

  const selectedBatModel = BATTERY_MODELS.find((b) => b.id === batteryModel) ?? BATTERY_MODELS[2];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `${kind}-${Date.now()}`;
    const position = { x: 200 + (nodes.length % 5) * 280, y: 100 + Math.floor(nodes.length / 5) * 220 };

    if (kind === "switch") {
      addNode({ id, type: "switch", position, data: { kind: "switch", name, switchType, ports, rackUHeight: 1, powerWatts, amperage } });
    } else if (kind === "rack") {
      addNode({ id, type: "rack", position, data: { kind: "rack", name, units, rackType } });
    } else if (kind === "camera") {
      addNode({ id, type: "camera", position, data: { kind: "camera", name, cameraType, ip, status: "online", ping: 0, powerWatts, amperage } });
    } else if (kind === "wall") {
      addNode({ id, type: "wall", position, data: { kind: "wall", name, width: wallWidth } });
    } else if (kind === "door") {
      addNode({ id, type: "door", position, data: { kind: "door", name } });
    } else if (kind === "lamp") {
      addNode({ id, type: "lamp", position, data: { kind: "lamp", name, color: lampColor, intensity: lampIntensity } });
    } else if (kind === "ceiling") {
      addNode({ id, type: "ceiling", position, data: { kind: "ceiling", name } });
    } else if (kind === "floor") {
      addNode({ id, type: "floor", position, data: { kind: "floor", name, width: wallWidth } }); // Reuse wallWidth state for floor size if needed
    } else if (kind === "olt") {
      addNode({ id, type: "olt", position, data: { kind: "olt", name, ponPorts, uplinkPorts, ip, rackUHeight: 2, powerWatts, amperage } });
    } else if (kind === "dio") {
      addNode({ id, type: "dio", position, data: { kind: "dio", name, ports: dioPorts, connectorType, rackUHeight: dioUHeight, powerWatts, amperage } });
    } else if (kind === "router") {
      addNode({ id, type: "router", position, data: { kind: "router", name, interfaces: routerIfaces, ip, rackUHeight: 2, powerWatts, amperage } });
    } else if (kind === "server") {
      addNode({ id, type: "server", position, data: { kind: "server", name, diskCount, ip, rackUHeight: 2, powerWatts, amperage } });
    } else if (kind === "battery_rack") {
      addNode({ id, type: "battery_rack", position, data: { kind: "battery_rack", name, shelves: batterySlots, batteryCount: batterySlots, capacityAh: selectedBatModel.capacityAh, isLithium: (selectedBatModel as any).isLithium } as any });
    } else if (kind === "stationary_battery") {
      addNode({ id, type: "stationary_battery", position, data: {
        kind: "stationary_battery",
        name,
        voltage: selectedBatModel.voltage as 12 | 24 | 48,
        capacityAh: selectedBatModel.capacityAh,
        isLithium: (selectedBatModel as any).isLithium,
        rackUHeight: (selectedBatModel as any).isLithium ? 3 : undefined,
        modelId: batteryModel,
      } as any });
    } else if (kind === "inverter") {
      addNode({ id, type: "inverter", position, data: { kind: "inverter", name, powerWatts: inverterPower, amperage, rackUHeight: 2 } });
    } else if (kind === "solar") {
      addNode({ id, type: "solar", position, data: { kind: "solar", name, powerWatts: solarPower } });
    } else if (kind === "patchpanel") {
      addNode({ id, type: "patchpanel", position, data: { kind: "patchpanel", name, ports: patchpanelPorts, rackUHeight: 1, powerWatts, amperage } });
    } else if (kind === "dwdm") {
      addNode({ id, type: "dwdm", position, data: { kind: "dwdm", name, model: "OptiX OSN 9800", rackUHeight: 14, powerWatts, amperage } });
    } else if (kind === "rectifier") {
      addNode({ id, type: "rectifier", position, data: { kind: "rectifier", name, modules: rectifierModules, rackUHeight: 4, powerWatts, amperage } });
    } else if (kind === "eci") {
      addNode({ id, type: "eci", position, data: { kind: "eci", name, model: "9603", lineModules: 2, activePorts: 8, ip, rackUHeight: 2, powerWatts, amperage } });
    }
    onClose();
  };

  const iconMap: Record<DialogKind, React.ReactNode> = {
    switch: <Network className="w-5 h-5" />,
    camera: <Camera className="w-5 h-5" />,
    rack: <HardDrive className="w-5 h-5" />,
    wall: <BrickWall className="w-5 h-5" />,
    door: <DoorClosed className="w-5 h-5" />,
    lamp: <Lightbulb className="w-5 h-5" />,
    ceiling: <Box className="w-5 h-5" />,
    floor: <Box className="w-5 h-5" />,
    olt: <Activity className="w-5 h-5" />,
    dio: <Network className="w-5 h-5" />,
    router: <Router className="w-5 h-5" />,
    server: <Server className="w-5 h-5" />,
    battery_rack: <HardDrive className="w-5 h-5" />,
    stationary_battery: <Battery className="w-5 h-5" />,
    inverter: <Zap className="w-5 h-5" />,
    solar: <Sun className="w-5 h-5" />,
    patchpanel: <GripHorizontal className="w-5 h-5" />,
    dwdm: <Activity className="w-5 h-5" />,
    rectifier: <Zap className="w-5 h-5" />,
    eci: <Activity className="w-5 h-5" />,
  };

  const colorMap: Record<DialogKind, string> = {
    switch: "bg-cyan-500/15 text-cyan-500",
    camera: "bg-fuchsia-500/15 text-fuchsia-500",
    rack: "bg-emerald-500/15 text-emerald-500",
    wall: "bg-slate-500/15 text-slate-400",
    door: "bg-amber-500/15 text-amber-500",
    lamp: "bg-yellow-400/15 text-yellow-500",
    ceiling: "bg-slate-400/15 text-slate-400",
    floor: "bg-stone-500/15 text-stone-500",
    olt: "bg-green-500/15 text-green-500",
    dio: "bg-indigo-500/15 text-indigo-500",
    router: "bg-orange-500/15 text-orange-500",
    server: "bg-blue-500/15 text-blue-500",
    battery_rack: "bg-yellow-500/15 text-yellow-500",
    stationary_battery: "bg-yellow-400/15 text-yellow-400",
    inverter: "bg-teal-500/15 text-teal-500",
    solar: "bg-orange-400/15 text-orange-500",
    patchpanel: "bg-slate-500/15 text-slate-400",
    dwdm: "bg-indigo-500/15 text-indigo-500",
    rectifier: "bg-blue-500/15 text-blue-500",
    eci: "bg-sky-500/15 text-sky-400",
  };

  const labelMap: Record<DialogKind, string> = {
    switch: "Switch de Rede",
    camera: "Câmera IP",
    rack: "Rack 19\" Server",
    wall: "Parede",
    door: "Porta",
    lamp: "Lâmpada",
    ceiling: "Teto / Forro",
    floor: "Plano do Chão",
    olt: "Terminal Óptico (OLT)",
    dio: "Distribuidor Óptico (DIO)",
    router: "Roteador Core",
    server: "Servidor Rack",
    battery_rack: "Rack de Baterias",
    stationary_battery: "Bateria Estacionária",
    inverter: "Inversor / UPS",
    solar: "Painel Solar",
    patchpanel: "Patch Panel RJ45",
    dwdm: "Equipamento DWDM",
    rectifier: "Sistema Retificador DC",
    eci: "Plataforma Óptica ECI 9603",
  };

  const isNetwork = ["switch", "camera", "rack", "olt", "dio", "router", "server", "inverter", "solar", "patchpanel", "dwdm", "rectifier", "eci"].includes(kind);
  const submitStyle = isNetwork
    ? "bg-primary text-primary-foreground hover:glow-cyan"
    : "bg-secondary text-foreground hover:bg-secondary/80 border border-border";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        initial={{ y: 16, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 8, scale: 0.98, opacity: 0 }}
        transition={{ type: "spring", damping: 22 }}
        className="glass rounded-2xl p-6 w-full max-w-md relative"
      >
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className={`grid place-items-center w-10 h-10 rounded-lg ${colorMap[kind]}`}>
            {iconMap[kind]}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {isNetwork ? "Novo dispositivo" : "Novo elemento de ambiente"}
            </div>
            <div className="font-display text-lg font-semibold">{labelMap[kind]}</div>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Nome">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              required
            />
          </Field>

          {!["wall", "door", "ceiling", "floor", "lamp", "rack", "battery_rack", "stationary_battery", "inverter", "solar"].includes(kind) && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amperagem (A)">
                <input type="number" step="0.1" value={amperage} onChange={(e) => setAmperage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </Field>
              <Field label="Potência (W)">
                <input type="number" step="1" value={powerWatts} onChange={(e) => setPowerWatts(parseFloat(e.target.value) || 0)}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </Field>
            </div>
          )}


          {kind === "switch" && (
            <>
              <Field label="Tipo">
                <select value={switchType} onChange={(e) => setSwitchType(e.target.value as SwitchType)}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {SWITCH_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label={`Portas: ${ports}`}>
                <input type="range" min={4} max={48} step={1} value={ports}
                  onChange={(e) => setPorts(parseInt(e.target.value))}
                  className="w-full accent-primary" />
              </Field>
            </>
          )}

          {kind === "rack" && (
            <>
              <Field label="Modelo de Rack">
                <select value={rackType} onChange={(e) => setRackType(e.target.value as "closed" | "open")}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="closed">Rack Fechado (Gabinete Fechado - Foto 1)</option>
                  <option value="open">Rack Aberto (Open Rack 2 Colunas - Foto 2)</option>
                </select>
              </Field>
              <Field label={`Altura do Rack: ${units}U`}>
                <select value={units} onChange={(e) => setUnits(parseInt(e.target.value))}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value={6}>6 U (Mini)</option>
                  <option value={12}>12 U (Médio)</option>
                  <option value={20}>20 U</option>
                  <option value={24}>24 U (Padrão Escritório)</option>
                  <option value={32}>32 U</option>
                  <option value={42}>42 U (Datacenter)</option>
                  <option value={48}>48 U (Extra Grande)</option>
                </select>
              </Field>
            </>
          )}

          {kind === "camera" && (
            <>
              <Field label="Tipo">
                <select value={cameraType} onChange={(e) => setCameraType(e.target.value as CameraType)}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {CAMERA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Endereço IP">
                <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.10"
                  pattern="^\d{1,3}(\.\d{1,3}){3}$"
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" required />
              </Field>
            </>
          )}

          {(kind === "wall" || kind === "floor") && (
            <>
              <Field label={`Tamanho: ${wallWidth}m`}>
                <input type="range" min={2} max={50} step={1} value={wallWidth}
                  onChange={(e) => setWallWidth(parseInt(e.target.value))}
                  className="w-full accent-primary" />
              </Field>
              <p className="text-xs text-muted-foreground">{kind === "wall" ? "A parede aparecerá no diagrama 3D como um bloco de alvenaria. Você pode adicionar múltiplas paredes e girá-las." : "O chão aparecerá no diagrama 3D como um piso sólido sob os equipamentos."}</p>
            </>
          )}

          {kind === "lamp" && (
            <>
              <Field label="Cor da luz">
                <div className="flex items-center gap-3">
                  <input type="color" value={lampColor} onChange={(e) => setLampColor(e.target.value)}
                    className="w-10 h-9 rounded cursor-pointer border border-border" />
                  <span className="text-sm font-mono text-muted-foreground">{lampColor}</span>
                </div>
              </Field>
              <Field label={`Intensidade: ${lampIntensity}x`}>
                <input type="range" min={0.5} max={6} step={0.5} value={lampIntensity}
                  onChange={(e) => setLampIntensity(parseFloat(e.target.value))}
                  className="w-full accent-primary" />
              </Field>
            </>
          )}

          {kind === "door" && (
            <p className="text-xs text-muted-foreground">Uma porta será renderizada no 3D como uma abertura dentro de uma parede.</p>
          )}

          {kind === "ceiling" && (
            <p className="text-xs text-muted-foreground">O teto aparece no 3D como uma estrutura de grid técnico semi-transparente suspensa.</p>
          )}

          {kind === "olt" && (
            <>
              <Field label={`Portas PON: ${ponPorts}`}>
                <input type="range" min={4} max={16} step={4} value={ponPorts}
                  onChange={(e) => setPonPorts(parseInt(e.target.value))}
                  className="w-full accent-primary" />
              </Field>
              <Field label={`Portas Uplink: ${uplinkPorts}`}>
                <input type="range" min={2} max={8} step={2} value={uplinkPorts}
                  onChange={(e) => setUplinkPorts(parseInt(e.target.value))}
                  className="w-full accent-primary" />
              </Field>
              <Field label="IP de Gerência">
                <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="10.0.0.1"
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary" />
              </Field>
            </>
          )}

          {kind === "dio" && (
            <>
              <Field label="Número de Portas">
                <select value={dioPorts} onChange={(e) => setDioPorts(parseInt(e.target.value))}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value={12}>12 Fibras (1U)</option>
                  <option value={24}>24 Fibras (1U)</option>
                  <option value={36}>36 Fibras (2U)</option>
                  <option value={48}>48 Fibras (2U)</option>
                  <option value={60}>60 Fibras (3U)</option>
                  <option value={72}>72 Fibras (3U) — máx</option>
                </select>
              </Field>
              <Field label="Tipo de Conector">
                <select value={connectorType} onChange={(e) => setConnectorType(e.target.value as "SC/APC" | "SC/UPC" | "LC")}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="SC/APC">SC/APC (Verde)</option>
                  <option value="SC/UPC">SC/UPC (Azul)</option>
                  <option value="LC">LC (Azul claro)</option>
                </select>
              </Field>
              <p className="text-xs text-muted-foreground">O modelo 3D será ajustado conforme o número de fibras ({dioUHeight}U de altura).</p>
            </>
          )}

          {kind === "router" && (
            <>
              <Field label={`Interfaces: ${routerIfaces}`}>
                <input type="range" min={4} max={48} step={4} value={routerIfaces}
                  onChange={(e) => setRouterIfaces(parseInt(e.target.value))}
                  className="w-full accent-primary" />
              </Field>
              <Field label="IP de Gerência">
                <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="10.0.0.1"
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary" />
              </Field>
            </>
          )}

          {kind === "server" && (
            <>
              <Field label={`Discos: ${diskCount}`}>
                <input type="range" min={1} max={12} step={1} value={diskCount}
                  onChange={(e) => setDiskCount(parseInt(e.target.value))}
                  className="w-full accent-primary" />
              </Field>
              <Field label="IP de Gerência">
                <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="10.0.0.10"
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary" />
              </Field>
            </>
          )}

          {kind === "battery_rack" && (
            <>
              <Field label={`Quantidade de Baterias: ${batterySlots}`}>
                <input type="range" min={2} max={16} step={2} value={batterySlots}
                  onChange={(e) => setBatterySlots(parseInt(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>2</span><span>4</span><span>6</span><span>8</span><span>10</span><span>12</span><span>14</span><span>16</span>
                </div>
              </Field>
              <Field label="Modelo de Bateria do Banco">
                <select value={batteryModel} onChange={(e) => setBatteryModel(e.target.value)}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {BATTERY_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </Field>
              <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-xs text-muted-foreground">
                <strong className="text-yellow-600 dark:text-yellow-400">{batterySlots} baterias {selectedBatModel.label}</strong> em série/paralelo.
                O rack 3D será gerado com tamanho e prateleiras proporcionais.
              </div>
            </>
          )}

          {kind === "stationary_battery" && (
            <>
              <Field label="Modelo de Bateria">
                <select value={batteryModel} onChange={(e) => setBatteryModel(e.target.value)}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {BATTERY_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </Field>
              <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-xs text-muted-foreground">
                <span className="font-semibold text-yellow-500">{selectedBatModel.voltage}V / {selectedBatModel.capacityAh}Ah</span>
                {" "}— Energia total: <span className="font-mono">{(selectedBatModel.voltage * selectedBatModel.capacityAh / 1000).toFixed(1)} kWh</span>
              </div>
            </>
          )}

          {kind === "inverter" && (
            <>
              <Field label={`Potência: ${inverterPower}W (${(inverterPower / 1000).toFixed(1)} kVA)`}>
                <select value={inverterPower} onChange={(e) => setInverterPower(parseInt(e.target.value))}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value={600}>600W (mini UPS)</option>
                  <option value={1000}>1000W / 1 kVA</option>
                  <option value={2000}>2000W / 2 kVA</option>
                  <option value={3000}>3000W / 3 kVA (padrão)</option>
                  <option value={5000}>5000W / 5 kVA</option>
                  <option value={10000}>10000W / 10 kVA (grande)</option>
                </select>
              </Field>
              <Field label="Amperagem (A)">
                <input type="number" step="0.1" value={amperage} onChange={(e) => setAmperage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </Field>
            </>
          )}

          {kind === "solar" && (
            <>
              <Field label={`Capacidade: ${solarPower}W`}>
                <input type="range" min={100} max={1000} step={50} value={solarPower}
                  onChange={(e) => setSolarPower(parseInt(e.target.value))}
                  className="w-full accent-primary" />
              </Field>
              <Field label="Amperagem (A)">
                <input type="number" step="0.1" value={amperage} onChange={(e) => setAmperage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </Field>
            </>
          )}

          {kind === "rectifier" && (
            <Field label={`Módulos Retificadores: ${rectifierModules}`}>
              <input type="range" min={1} max={6} step={1} value={rectifierModules}
                onChange={(e) => setRectifierModules(parseInt(e.target.value))}
                className="w-full accent-primary" />
            </Field>
          )}

          {kind === "patchpanel" && (
            <Field label="Portas RJ45">
              <select value={patchpanelPorts} onChange={(e) => setPatchpanelPorts(Number(e.target.value))}
                className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value={12}>12 Portas (1U)</option>
                <option value={24}>24 Portas (1U)</option>
                <option value={48}>48 Portas (2U)</option>
              </select>
            </Field>
          )}
        </div>

        <button type="submit"
          className={`mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition ${submitStyle}`}>
          <Plus className="w-4 h-4" /> Adicionar ao diagrama
        </button>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
