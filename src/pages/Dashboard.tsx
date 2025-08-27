import React, { useMemo } from "react";
import { useRealtime } from "../services/realtime";
import Stat from "../components/Stat";
import WheelChart from "../components/WheelChart";
import EventsLog from "../components/EventsLog";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { fmtTime } from "../utils/format";
import type { WheelId } from "../types";

export default function Dashboard() {
  const { online, gps, act, events, byWheel } = useRealtime(true);

  const aggregate = useMemo(() => {
    const wheels: WheelId[] = [1, 2, 3, 4];
    const base = byWheel[1] ?? [];
    return base.map((_, i) => {
      const t = byWheel[1][i]?.ts ?? Date.now();
      const sum = wheels.reduce((acc, w) => acc + (byWheel[w][i]?.speed ?? 0), 0);
      const avg = sum / wheels.length;
      return { ts: t, avg };
    });
  }, [byWheel]);

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>KS Realtime Dashboard</h1>
          <p>vehiculo-01 • simulated stream • MQTT → WS/API model</p>
        </div>
        <div className="statusbar">
          <span className={`dot ${online ? "ok" : "bad"}`} />
          <span>{online ? "Online" : "Offline"}</span>
          <span> • GPS fix {gps.fix}D • HDOP {gps.hdop.toFixed(2)}</span>
          <span> • actuator {act.state}</span>
        </div>
      </header>

      <section className="grid two">
        <div className="card">
          <div className="card-title">GPS</div>
          <div className="grid four">
            <Stat label="Latitude" value={gps.lat.toFixed(6)} />
            <Stat label="Longitude" value={gps.lon.toFixed(6)} />
            <Stat label="Speed" value={`${gps.spd_kph.toFixed(1)} km/h`} />
            <Stat label="Altitude" value={`${gps.alt.toFixed(0)} m`} />
            <Stat label="HDOP" value={gps.hdop.toFixed(2)} />
            <Stat label="Fix" value={`${gps.fix}D`} />
            <Stat label="Actuator" value={`${act.dir} • ${act.duty.toFixed(0)}%`} />
            <Stat label="State" value={act.state} />
          </div>
        </div>

        <div className="card">
          <div className="card-title">Controls (mock)</div>
          <div className="controls">
            <div className="row">
              <input placeholder="Target speed (km/h)" />
              <button>Send</button>
            </div>
            <div className="row">
              <button className="danger">Shutdown</button>
              <button>Arm</button>
              <button className="outline">Standby</button>
            </div>
            <small>Wire these to /api/commands later.</small>
          </div>
        </div>
      </section>

      <section className="grid four">
        <WheelChart data={byWheel[1]} wheel={1} />
        <WheelChart data={byWheel[2]} wheel={2} />
        <WheelChart data={byWheel[3]} wheel={3} />
        <WheelChart data={byWheel[4]} wheel={4} />
      </section>

      <section className="grid three">
        <EventsLog events={events} />
        <div className="card two-span">
          <div className="card-title">Vehicle Speed (aggregate)</div>
          <div className="chart big">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregate} margin={{ left: 0, right: 16, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="ts" tickFormatter={fmtTime} />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  labelFormatter={(l) => new Date(Number(l)).toLocaleString()}
                  formatter={(v: any) => [`${v.toFixed?.(1) ?? v} km/h`, "avg"]}
                />
                <Line type="monotone" dataKey="avg" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div>Schema v1 • Demo only</div>
        <div>Replace simulator with WS client: <code>new WebSocket("wss://api.example.com/ws/live?device_id=vehiculo-01")</code></div>
      </footer>
    </div>
  );
}
