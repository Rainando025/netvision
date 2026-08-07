export type SwitchType = "Gerenciável L2" | "Gerenciável L3" | "PoE" | "Não Gerenciável";
export type CameraType = "Dome" | "Bullet" | "PTZ" | "Fisheye" | "Box";

export type DeviceStatus = "online" | "offline" | "warning";

export type NodeDataKind = "switch" | "camera" | "rack" | "wall" | "door" | "lamp" | "ceiling" | "floor" | "olt" | "dio" | "router" | "server" | "battery_rack" | "stationary_battery" | "inverter" | "solar" | "patchpanel" | "dwdm" | "rectifier" | "eci";

export interface ThreeDAttributes {
  position3d?: { x: number; y: number; z: number };
  rotation3d?: { x: number; y: number; z: number };
  rackId?: string; // ID of the rack it is mounted inside
  rackUnit?: number; // Slot index (1-based) where it starts inside the rack
  rackUHeight?: number; // Height in rack units (U)
  customModelUrl?: string; // Loaded glTF/OBJ object URL
  customModelName?: string; // Display name of custom model
  powerWatts?: number; // optional device power (W)
  amperage?: number; // optional device amperage (A)
}

export interface SwitchNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "switch";
  name: string;
  switchType: SwitchType;
  ports: number;
  ip?: string;
}

export interface CameraNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "camera";
  name: string;
  cameraType: CameraType;
  ip: string;
  ping?: number | null;
  status?: DeviceStatus;
}

export type RackType = "closed" | "open";

export interface RackNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "rack";
  name: string;
  units: number; // e.g. 12, 24, 42 U
  rackType?: RackType; // "closed" | "open"
  ip?: string;
}

export interface WallNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "wall";
  name: string;
  width?: number; // Lenght of the wall
}

export interface DoorNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "door";
  name: string;
}

export interface LampNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "lamp";
  name: string;
  color?: string; // hex
  intensity?: number;
}

export interface CeilingNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "ceiling";
  name: string;
}

export interface FloorNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "floor";
  name: string;
  width?: number;
}

export interface OltNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "olt";
  name: string;
  ponPorts: number;
  uplinkPorts: number;
  ip?: string;
}

export interface DioNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "dio";
  name: string;
  ports: number; // usually 12, 24, 48
  connectorType: "SC/APC" | "SC/UPC" | "LC";
}

export interface RouterNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "router";
  name: string;
  interfaces: number;
  ip?: string;
}

export interface ServerNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "server";
  name: string;
  diskCount: number;
  ip?: string;
}

export interface BatteryRackNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "battery_rack";
  name: string;
  shelves: number;
}

export interface StationaryBatteryNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "stationary_battery";
  name: string;
  voltage: 12 | 24 | 48;
  capacityAh: number;
}

export interface InverterNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "inverter";
  name: string;
  powerWatts: number;
}

export interface SolarNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "solar";
  name: string;
  powerWatts: number;
}

export interface PatchPanelNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "patchpanel";
  name: string;
  ports: number; // 12, 24, 48
}

export interface DwdmNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "dwdm";
  name: string;
  model: string;
  ip?: string;
}

export interface RectifierNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "rectifier";
  name: string;
  modules: number; // Number of rectifier modules installed
}

export interface EciNodeData extends Record<string, unknown>, ThreeDAttributes {
  kind: "eci";
  name: string;
  model: string;       // e.g. "9603"
  lineModules: number; // 1 or 2 optical line modules
  activePorts?: number; // how many LC ports are lit
  ip?: string;
}

export type NodeData =
  | SwitchNodeData
  | CameraNodeData
  | RackNodeData
  | WallNodeData
  | DoorNodeData
  | LampNodeData
  | CeilingNodeData
  | FloorNodeData
  | OltNodeData
  | DioNodeData
  | RouterNodeData
  | ServerNodeData
  | BatteryRackNodeData
  | StationaryBatteryNodeData
  | InverterNodeData
  | SolarNodeData
  | PatchPanelNodeData
  | DwdmNodeData
  | RectifierNodeData
  | EciNodeData;

export interface ScannedDevice {
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  deviceType: string;
  status: DeviceStatus;
  ping: number;
  ports: number[];
}
