import { useEffect, useMemo, useRef, useState } from "react";
import type { GPS, Actuator, EventMsg, WheelId, ByWheel } from "../types";

type Incoming =
  | { type: "gps"; data: GPS }
  | { type: "actuator"; data: Actuator }
  | { type: "speed"; data: { ts: number; wheel: WheelId; speed_kph: number; pulses?: number } }
  | { type: "event"; data: EventMsg };

export function useRealtime(enabled: boolean) {
  const [online, setOnline] = useState(false);
  const [gps, setGps] = useState<GPS>({ lat: 0, lon: 0, spd_kph: 0, alt: 0, hdop: 0, fix: 0 });
  const [act, setAct] = useState<Actuator>({ duty: 0, dir: "stop", stby: false, state: "idle" });
  const [events, setEvents] = useState<EventMsg[]>([]);
  const [byWheel, setByWheel] = useState<ByWheel>({ 1: [], 2: [], 3: [], 4: [] });

  // simple auto-reconnect (exponencial con tope)
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const maxHistory = 90; // mantener ~90 puntos por rueda

  useEffect(() => {
    if (!enabled) return;

    const url = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/live?device_id=vehiculo-01";
    let stop = false;

    const connect = () => {
      if (stop) return;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0;
        setOnline(true);
      };

      ws.onclose = () => {
        setOnline(false);
        // backoff
        retryRef.current = Math.min(retryRef.current + 1, 6);
        const delay = 500 * Math.pow(2, retryRef.current); // 0.5s,1s,2s,... tope ~32s
        setTimeout(() => !stop && connect(), delay);
      };

      ws.onmessage = (ev) => {
        let msg: Incoming;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (msg.type === "gps") {
          setGps(msg.data);
        } else if (msg.type === "actuator") {
          setAct(msg.data);
        } else if (msg.type === "speed") {
          const { ts, wheel, speed_kph } = msg.data;
          setByWheel((prev) => ({
            ...prev,
            [wheel]: [...prev[wheel], { ts, speed: speed_kph }].slice(-maxHistory),
          }));
        } else if (msg.type === "event") {
          setEvents((prev) => [msg.data, ...prev].slice(0, 200));
        }
      };
    };

    connect();
    return () => {
      stop = true;
      try { wsRef.current?.close(); } catch {}
    };
  }, [enabled]);

  return { online, gps, act, events, byWheel } as const;
}

export default useRealtime;
