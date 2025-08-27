import { useMemo, useRef, useState } from "react";
import type { GPS, Actuator, EventMsg, SpeedSample, ByWheel, WheelId } from "../types";
import useInterval from "./useInterval";
import { clamp, rnd, now } from "../utils/format";

export default function useSimulatedStream(enabled: boolean): {
  online: boolean;
  gps: GPS;
  act: Actuator;
  events: EventMsg[];
  byWheel: ByWheel;
} {
  const [online, setOnline] = useState(true);
  const [gps, setGps] = useState<GPS>({ lat: 19.043, lon: -98.198, spd_kph: 0, alt: 2160, hdop: 0.8, fix: 3 });
  const [act, setAct] = useState<Actuator>({ duty: 0, dir: "stop", stby: false, state: "idle" });
  const [speeds, setSpeeds] = useState<SpeedSample[]>([]);
  const [events, setEvents] = useState<EventMsg[]>([]);

  const historyLen = 90; // ~ last 90 seconds
  const pushEvent = (e: EventMsg) => setEvents((prev) => [e, ...prev].slice(0, 200));

  // Toggle online occasionally
  useInterval(() => { if (enabled && Math.random() < 0.02) setOnline((o) => !o); }, 3000);

  // GPS (1 Hz)
  useInterval(() => {
    if (!enabled) return;
    const jitter = (d: number) => d + rnd(-0.0005, 0.0005);
    const speed = clamp(gps.spd_kph + rnd(-4, 5), 0, 80);
    const next: GPS = {
      lat: jitter(gps.lat),
      lon: jitter(gps.lon),
      spd_kph: speed,
      alt: clamp(gps.alt + rnd(-0.8, 0.8), 2140, 2180),
      hdop: clamp(gps.hdop + rnd(-0.05, 0.07), 0.6, 1.6),
      fix: 3,
    };
    setGps(next);
    if (Math.random() < 0.03) pushEvent({ ts: now(), type: "state_change", message: `Speed target ~${speed.toFixed(0)} km/h` });
  }, 1000);

  // Actuator (~1.5 Hz)
  useInterval(() => {
    if (!enabled) return;
    const duty = clamp(act.duty + rnd(-8, 12), 0, 100);
    const dir: Actuator["dir"] = duty < 5 ? "stop" : "fwd";
    const state: Actuator["state"] = duty < 5 ? "idle" : "engaged";
    setAct({ duty, dir, stby: false, state });
    if (Math.random() < 0.02) pushEvent({ ts: now(), type: "tamper", level: "warn", message: "Enclosure opened" });
  }, 1500);

  // Wheel speeds (10 Hz -> downsample ~2 Hz)
  const sampleAccumulator = useRef(0);
  useInterval(() => {
    if (!enabled) return;
    const t = now();
    const base = gps.spd_kph;
    const samples: SpeedSample[] = [1, 2, 3, 4].map((w) => ({
      ts: t,
      wheel: w as WheelId,
      speed_kph: clamp(base + rnd(-3, 3) + (w - 2.5) * rnd(-0.6, 0.6), 0, 90),
      pulses: Math.max(0, Math.round(base * 2 + rnd(-3, 3))),
    }));
    sampleAccumulator.current += 1;
    if (sampleAccumulator.current % 5 === 0) {
      setSpeeds((prev) => [...prev, ...samples].slice(-historyLen * 4));
    }
  }, 100);

  // Random faults
  useInterval(() => {
    if (enabled && Math.random() < 0.01) {
      pushEvent({ ts: now(), type: "fault", level: "error", message: "Motor overcurrent detected" });
    }
  }, 2000);

  // Derived chart data per wheel (sin Object.keys)
const byWheel: ByWheel = useMemo(() => {
  const wheels: WheelId[] = [1, 2, 3, 4];
  const map: ByWheel = { 1: [], 2: [], 3: [], 4: [] };

  // mete muestras por rueda
  speeds.forEach((s) => {
    map[s.wheel].push({ ts: s.ts, speed: s.speed_kph });
  });

  // recorta historial por rueda
  for (const w of wheels) {
    map[w] = map[w].slice(-historyLen);
  }

  return map;
}, [speeds]);


  return { online, gps, act, events, byWheel };
}
