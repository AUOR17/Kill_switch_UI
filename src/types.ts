export interface GPS {
  lat: number;
  lon: number;
  spd_kph: number;
  alt: number;
  hdop: number;
  fix: 0 | 2 | 3;
}

export interface SpeedSample {
  ts: number;           // epoch ms
  wheel: 1 | 2 | 3 | 4;
  speed_kph: number;
  pulses: number;
}

export interface Actuator {
  duty: number;         // 0-100
  dir: "fwd" | "rev" | "stop";
  stby: boolean;
  state: "idle" | "engaged" | "fault";
}

export type EventType = "tamper" | "fault" | "state_change" | "log" | "error";

export interface EventMsg {
  ts: number;
  type: EventType;
  level?: "info" | "warn" | "error";
  message: string;
}

export type WheelId = 1 | 2 | 3 | 4;

export type ByWheel = Record<WheelId, { ts: number; speed: number }[]>;

